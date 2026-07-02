"""Inspect supported product source files and write a local sanitized report."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from product_pipeline import inspect_sources, write_inspection_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect product database sources.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    infos = inspect_sources(args.input)
    args.output.mkdir(parents=True, exist_ok=True)
    write_inspection_report(infos, args.output / "products_inspection_report.md")
    (args.output / "products_inspection_report.json").write_text(
        json.dumps([info.__dict__ for info in infos], indent=2),
        encoding="utf-8",
    )
    print(f"Inspected {len(infos)} source sheet(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
