from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from lead_pipeline import normalize_emails, normalize_phones, prepare_data, run_pipeline, validate_workbook


class LeadPipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fixture_dir = SCRIPT_DIR / "fixtures"

    def test_normalizes_email_and_phone_values(self) -> None:
        email, secondary, status = normalize_emails(" ANA @ Example.Invalid ; second@example.invalid ")
        phone, secondary_phone, phone_status = normalize_phones("912 345 678; +351 213 000 000")

        self.assertEqual(email, "ana@example.invalid")
        self.assertEqual(secondary, "second@example.invalid")
        self.assertEqual(status, "valid")
        self.assertEqual(phone, "912345678")
        self.assertEqual(secondary_phone, "+351213000000")
        self.assertEqual(phone_status, "valid")

    def test_prepares_and_deduplicates_synthetic_leads(self) -> None:
        prepared = prepare_data(self.fixture_dir, import_batch="TEST-BATCH")

        self.assertEqual(len(prepared.source_infos), 1)
        self.assertEqual(len(prepared.source_rows), 3)
        self.assertEqual(len(prepared.master_rows), 2)
        self.assertEqual(len([dup for dup in prepared.duplicates if dup["duplicate_type"] == "exact"]), 1)
        self.assertTrue(any(row["review_required"] == "true" for row in prepared.master_rows))

    def test_builds_and_validates_workbook(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            result = run_pipeline(self.fixture_dir, output_dir, "synthetic_standardized.xlsx")
            validation = validate_workbook(result["workbook_path"])

            self.assertTrue(result["validation"]["valid"])
            self.assertTrue(validation["valid"])
            self.assertIn("MASTER_LEADS", validation["workbook_sheets"])
            self.assertEqual(validation["master_leads"], 2)


if __name__ == "__main__":
    unittest.main()
