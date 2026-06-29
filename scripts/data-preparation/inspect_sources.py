"""Inspect supported Excel/CSV lead source files and write a local report."""

from __future__ import annotations

import argparse
from pathlib import Path

from lead_pipeline import inspect_sources, write_inspection_report, write_json_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect lead database sources.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    infos = inspect_sources(args.input)
    args.output.mkdir(parents=True, exist_ok=True)
    write_inspection_report(infos, args.output / "inspection_report.md")
    write_json_report(args.output / "inspection_report.json", [info.__dict__ for info in infos])
    print(f"Inspected {len(infos)} source sheet(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
