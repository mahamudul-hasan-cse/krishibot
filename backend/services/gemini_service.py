"""
Async client for Google Gemini (Generative Language API) — used as the
cloud fallback when the local Ollama server is unreachable.

Mirrors the public interface of `ollama_service` so callers don't need
to know which provider produced the response:

    - chat_stream(messages, system_prompt) -> AsyncGenerator[str, None]
    - analyze_image(base64_image, prompt) -> str
    - check_health() -> bool
"""

import json
import os
from collections.abc import AsyncGenerator

import httpx
from fastapi import HTTPException

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

_TIMEOUT = httpx.Timeout(connect=10.0, read=120.0, write=30.0, pool=5.0)


def is_configured() -> bool:
    """True when an API key is present, i.e. the fallback can be attempted."""
    return bool(GEMINI_API_KEY)


def _messages_to_contents(messages: list[dict[str, str]]) -> list[dict]:
    """Map OpenAI-style {role, content} turns to Gemini's {role, parts} shape."""
    contents = []
    for m in messages:
        role = "model" if m.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
    return contents


async def chat_stream(
    messages: list[dict[str, str]],
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    """
    Stream a chat completion token-by-token from Gemini.

    Same signature as ``ollama_service.chat_stream`` so the LLM router
    can swap providers transparently.
    """
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Gemini is not configured (missing GEMINI_API_KEY).",
        )

    payload = {
        "contents": _messages_to_contents(messages),
        "systemInstruction": {"parts": [{"text": system_prompt}]},
    }

    url = f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}:streamGenerateContent"

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            async with client.stream(
                "POST",
                url,
                params={"key": GEMINI_API_KEY, "alt": "sse"},
                json=payload,
            ) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    raise HTTPException(
                        status_code=502,
                        detail=f"Gemini returned {response.status_code}: {body.decode()[:200]}",
                    )

                async for raw_line in response.aiter_lines():
                    line = raw_line.strip()
                    if not line or not line.startswith("data: "):
                        continue

                    data = line[6:]  # strip "data: "
                    if data == "[DONE]":
                        break

                    try:
                        chunk = json.loads(data)
                    except json.JSONDecodeError:
                        continue

                    candidates = chunk.get("candidates") or []
                    if not candidates:
                        continue
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        text = part.get("text", "")
                        if text:
                            yield text

    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail="Cannot reach Gemini. Check your internet connection.",
        ) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="Gemini request timed out.",
        ) from exc


async def analyze_image(base64_image: str, prompt: str) -> str:
    """
    Produce a disease analysis using Gemini's text model.

    The ``base64_image`` is intentionally NOT forwarded, to match the
    behaviour of the other providers (filename/classifier-derived context
    is already embedded in ``prompt``). Kept in the signature so the
    interface matches ``ollama_service.analyze_image``.
    """
    del base64_image  # unused — see docstring

    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Gemini is not configured (missing GEMINI_API_KEY).",
        )

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
    }

    url = f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}:generateContent"

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                url,
                params={"key": GEMINI_API_KEY},
                json=payload,
            )
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail="Cannot reach Gemini. Check your internet connection.",
        ) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="Gemini request timed out.",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini returned {response.status_code}: {response.text[:200]}",
        )

    data = response.json()
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts)


async def check_health() -> bool:
    """
    Lightweight reachability probe. Confirms the API key is present and
    that the model endpoint responds. Does NOT trigger any inference.
    """
    if not is_configured():
        return False
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            response = await client.get(
                f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}",
                params={"key": GEMINI_API_KEY},
            )
        return response.status_code == 200
    except Exception:
        return False
