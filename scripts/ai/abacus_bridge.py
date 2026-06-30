#!/usr/bin/env python3
"""Minimal JSON-over-stdin bridge for Abacus.AI prompt evaluation."""

from __future__ import annotations

import json
import signal
import sys
from typing import Any


def _error(code: str, message: str) -> None:
    print(json.dumps({"error": {"code": code, "message": message}}))


def _load_request() -> dict[str, Any] | None:
    try:
        payload = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        _error("invalid_response", "Bridge input was not valid JSON.")
        return None

    if not isinstance(payload, dict):
        _error("invalid_response", "Bridge input must be a JSON object.")
        return None

    return payload


def _validate_model(model: str) -> bool:
    try:
        from abacusai import LLMName  # type: ignore
    except Exception:
        return True

    values = []
    for item in dir(LLMName):
        if item.startswith("_"):
            continue
        value = getattr(LLMName, item)
        if isinstance(value, str):
            values.append(value)
        elif hasattr(value, "value"):
            values.append(value.value)

    return not values or model in values


def main() -> int:
    if hasattr(signal, "alarm"):
        signal.alarm(120)
    request = _load_request()
    if request is None:
        return 0

    api_key = request.get("api_key")
    model = request.get("llm_name")

    if not isinstance(api_key, str) or not api_key.strip():
        _error("authentication_error", "Abacus API key is missing.")
        return 0

    if not isinstance(model, str) or not model.strip():
        _error("model_not_found", "Abacus model is missing.")
        return 0

    try:
        from abacusai import ApiClient  # type: ignore
    except Exception:
        _error("runtime_dependency_missing", "Python package abacusai is not installed.")
        return 0

    if not _validate_model(model):
        _error("model_not_found", "Selected Abacus model is not present in the SDK catalog.")
        return 0

    try:
        request_kwargs: dict[str, Any] = {
            "llm_name": model,
            "max_tokens": request.get("max_tokens"),
            "messages": request.get("messages"),
            "prompt": request.get("prompt"),
            "response_type": request.get("response_type"),
            "stop_sequences": request.get("stop_sequences"),
            "system_message": request.get("system_message"),
            "temperature": request.get("temperature"),
            "top_p": request.get("top_p"),
        }
        request_kwargs = {key: value for key, value in request_kwargs.items() if value is not None}
        client = ApiClient(api_key)
        response = client.evaluate_prompt(**request_kwargs)
    except Exception as exc:
        message = str(exc)
        lower = message.lower()
        code = "unknown_provider_error"
        if "credit" in lower:
            code = "insufficient_credits"
        elif "auth" in lower or "api key" in lower:
            code = "authentication_error"
        elif "model" in lower:
            code = "model_not_found"
        print(json.dumps({"error": {"code": code, "message": "Abacus request failed."}}))
        return 0

    content = getattr(response, "content", None) or getattr(response, "text", None) or response
    parsed = None

    if isinstance(content, (dict, list)):
        parsed = content
        content_text = json.dumps(content)
    else:
        content_text = str(content)
        if request.get("response_type") == "json":
            try:
                parsed = json.loads(content_text)
            except Exception:
                parsed = None

    if isinstance(parsed, dict) and isinstance(parsed.get("contextUsed"), str):
        parsed["contextUsed"] = [parsed["contextUsed"]]

    print(
        json.dumps(
            {
                "content": content_text,
                "model": model,
                "parsed": parsed,
                "request_id": getattr(response, "request_id", None),
                "usage": {
                    "input_tokens": getattr(response, "input_tokens", None),
                    "output_tokens": getattr(response, "output_tokens", None),
                    "total_tokens": getattr(response, "total_tokens", None),
                },
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
