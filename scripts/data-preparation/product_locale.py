"""Portuguese locale helpers for product source profiling."""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

_CURRENCY_RE = re.compile(r"[€$£\s]", re.IGNORECASE)
_THOUSANDS_DOT = re.compile(r"^(\d{1,3}(?:\.\d{3})+)(,\d+)?$")
_THOUSANDS_SPACE = re.compile(r"^(\d{1,3}(?:\s\d{3})+)(,\d+)?$")
_PACKAGING_RE = re.compile(r"\((\d[\d\s.]*)\s*UN\)", re.IGNORECASE)
_EAN_RE = re.compile(r"^\d{8,14}$")

DATE_FORMATS = (
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d.%m.%Y",
    "%Y-%m-%d",
    "%d/%m/%y",
)


def normalize_header(value: str) -> str:
    cleaned = value.strip().lower()
    cleaned = cleaned.replace("\ufeff", "")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def parse_portuguese_decimal(value: str | None) -> tuple[str, str]:
    """Return (normalized_decimal_string, status). Status is valid|empty|invalid."""

    if value is None:
        return "", "empty"

    raw = str(value).strip()
    if not raw:
        return "", "empty"

    cleaned = _CURRENCY_RE.sub("", raw)
    cleaned = cleaned.replace("\xa0", "").strip()
    if not cleaned:
        return "", "empty"

    if _THOUSANDS_DOT.match(cleaned) or _THOUSANDS_SPACE.match(cleaned):
        integer_part, fractional = cleaned.split(",", 1) if "," in cleaned else (cleaned, "")
        integer_part = re.sub(r"[.\s]", "", integer_part)
        cleaned = f"{integer_part}.{fractional}" if fractional else integer_part
    elif "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")
    elif "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")

    try:
        normalized = format(Decimal(cleaned), "f")
    except (InvalidOperation, ValueError):
        return raw, "invalid"

    if "." in normalized:
        normalized = normalized.rstrip("0").rstrip(".") or "0"

    return normalized, "valid"


def parse_portuguese_date(value: str | None) -> tuple[str, str]:
    if value is None:
        return "", "empty"

    raw = str(value).strip()
    if not raw:
        return "", "empty"

    for pattern in DATE_FORMATS:
        try:
            parsed = datetime.strptime(raw, pattern).date()
            return parsed.isoformat(), "valid"
        except ValueError:
            continue

    return raw, "invalid"


def extract_packaging_quantity_hint(designation: str) -> tuple[str, str]:
    match = _PACKAGING_RE.search(designation or "")
    if not match:
        return "", "empty"

    digits = re.sub(r"[^\d]", "", match.group(1))
    if not digits:
        return "", "invalid"

    return digits, "valid"


def is_probable_ean(value: str) -> bool:
    return bool(_EAN_RE.match(re.sub(r"\D", "", value or "")))


def normalize_unit(value: str | None) -> str:
    if not value:
        return ""

    normalized = value.strip()
    aliases = {
        "unidade": "Unidade",
        "un": "Unidade",
        "un.": "Unidade",
        "milheiro": "Milheiro",
        "mil": "Milheiro",
        "cx": "Caixa",
        "caixa": "Caixa",
    }
    return aliases.get(normalized.lower(), normalized)


def today_iso() -> str:
    return date.today().isoformat()
