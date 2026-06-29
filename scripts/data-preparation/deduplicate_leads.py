"""Run standardization and write a local duplicate report without workbook styling."""

from __future__ import annotations

import argparse
from pathlib import Path

from lead_pipeline import prepare_data, write_json_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Create duplicate report for lead sources.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    prepared = prepare_data(args.input)
    args.output.mkdir(parents=True, exist_ok=True)
    write_json_report(args.output / "duplicates.json", prepared.duplicates)
    print(f"Wrote {len(prepared.duplicates)} duplicate candidate(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
