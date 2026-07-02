from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from product_locale import extract_packaging_quantity_hint, parse_portuguese_date, parse_portuguese_decimal
from product_pipeline import prepare_data, run_pipeline


class ProductPipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fixture_dir = SCRIPT_DIR / "fixtures" / "products"

    def test_parses_portuguese_numbers_and_dates(self) -> None:
        price, status = parse_portuguese_decimal("104,000 €")
        self.assertEqual(status, "valid")
        self.assertEqual(price, "104")

        thousands, thousands_status = parse_portuguese_decimal("1.234,56")
        self.assertEqual(thousands_status, "valid")
        self.assertEqual(thousands, "1234.56")

        parsed_date, date_status = parse_portuguese_date("02/07/2026")
        self.assertEqual(date_status, "valid")
        self.assertEqual(parsed_date, "2026-07-02")

        pack, pack_status = extract_packaging_quantity_hint("COPO DEMO (2000 UN)")
        self.assertEqual(pack_status, "valid")
        self.assertEqual(pack, "2000")

    def test_prepares_and_deduplicates_synthetic_products(self) -> None:
        prepared = prepare_data(self.fixture_dir, import_batch="TEST-PRODUCTS")

        self.assertEqual(len(prepared.source_infos), 1)
        self.assertGreaterEqual(len(prepared.master_rows), 3)
        self.assertTrue(any(dup["duplicate_type"] == "exact" for dup in prepared.duplicates))
        self.assertFalse(prepared.quality_report["inventory_quantities_reported"])
        self.assertIn("stock_atual", prepared.quality_report["excluded_inventory_fields_detected"])

    def test_builds_workbook_without_inventory_quantities(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            result = run_pipeline(self.fixture_dir, output_dir, "synthetic_products_standardized.xlsx")
            self.assertGreaterEqual(result["master_products"], 3)
            self.assertTrue((output_dir / "products_quality_report.json").exists())


if __name__ == "__main__":
    unittest.main()
