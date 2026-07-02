"""Run the full product staging workflow and build a standardized workbook."""

from __future__ import annotations

import argparse
from pathlib import Path

from product_pipeline import run_pipeline


def main() -> int:
    parser = argparse.ArgumentParser(description="Standardize product database sources for staging review.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--workbook-name", default="Product_Database_Standardized.xlsx")
    args = parser.parse_args()

    result = run_pipeline(args.input, args.output, args.workbook_name)
    print(
        "Prepared "
        f"{result['master_products']} products, "
        f"{result['duplicates']} duplicate groups, "
        f"{result['errors']} errors."
    )
    print(f"Workbook: {result['workbook_path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
