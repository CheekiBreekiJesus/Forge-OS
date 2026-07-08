"""Build the standardized lead workbook from supported source files."""

from __future__ import annotations

import argparse
from pathlib import Path

from lead_pipeline import build_workbook, prepare_data


def main() -> int:
    parser = argparse.ArgumentParser(description="Build standardized lead workbook.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-file", required=True, type=Path)
    args = parser.parse_args()

    prepared = prepare_data(args.input)
    build_workbook(prepared, args.output_file)
    print(args.output_file)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
