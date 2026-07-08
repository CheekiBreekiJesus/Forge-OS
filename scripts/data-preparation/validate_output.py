"""Validate a generated standardized lead workbook."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from lead_pipeline import validate_workbook


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate standardized lead workbook.")
    parser.add_argument("--workbook", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    result = validate_workbook(args.workbook)
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
    print(payload)
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
