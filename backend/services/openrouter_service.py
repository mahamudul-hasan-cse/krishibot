"""
Async client for OpenRouter (https://openrouter.ai) — used as a cloud
fallback when the local Ollama server is unreachable.

Mirrors the public interface of `ollama_service` so callers don't need
to know which provider produced the response:

    - chat_stream(messages, system_prompt) -> AsyncGenerator[str, None]
    - analyze_image(base64_image, prompt) -> str
    - check_health() -> bool

OpenRouter exposes an OpenAI-compatible API. We only use the chat
completions endpoint (with `stream=true` for token-by-token output).
The image bytes are NOT forwarded — see analyze_image for details.
"""

import json
import os
from collections.abc import AsyncGenerator

import httpx
from fastapi import HTTPException

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

# OpenRouter recommends sending these headers so usage shows up correctly
# on the dashboard and your app gets attributed in their public rankings.
_REFERER = os.getenv("OPENROUTER_REFERER", "https://krishibot.local")
_TITLE = os.getenv("OPENROUTER_TITLE", "KrishiBot")

_TIMEOUT = httpx.Timeout(connect=10.0, read=120.0, write=30.0, pool=5.0)


def is_configured() -> bool:
    """True when an API key is present, i.e. the fallback can be attempted."""
    return bool(OPENROUTER_API_KEY)


def _auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": _REFERER,
        "X-Title": _TITLE,
    }


async def chat_stream(
    messages: list[dict[str, str]],
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    """
    Stream a chat completion token-by-token from OpenRouter.

    Same signature as ``ollama_service.chat_stream`` so the LLM router
    can swap providers transparently.
    """
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="OpenRouter is not configured (missing OPENROUTER_API_KEY).",
        )

    payload = {
        "model": OPENROUTER_MODEL,
        "stream": True,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            async with client.stream(
                "POST",
                f"{OPENROUTER_BASE_URL}/chat/completions",
                json=payload,
                headers=_auth_headers(),
            ) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    raise HTTPException(
                        status_code=502,
                        detail=f"OpenRouter returned {response.status_code}: {body.decode()[:200]}",
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

                    # OpenAI-style stream: choices[0].delta.content
                    delta = (
                        chunk.get("choices", [{}])[0]
                        .get("delta", {})
                        .get("content", "")
                    )
                    if delta:
                        yield delta

    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail="Cannot reach OpenRouter. Check your internet connection.",
        ) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="OpenRouter request timed out.",
        ) from exc


async def analyze_image(base64_image: str, prompt: str) -> str:
    """
    Produce a disease analysis using OpenRouter's text model.

    The ``base64_image`` is intentionally NOT forwarded — most free
    models are text-only, and the prompt already contains filename- and
    classifier-derived context for the disease. Kept in the signature
    so the interface matches ``ollama_service.analyze_image``.
    """
    del base64_image  # unused — see docstring

    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="OpenRouter is not configured (missing OPENROUTER_API_KEY).",
        )

    payload = {
        "model": OPENROUTER_MODEL,
        "stream": False,
        "messages": [{"role": "user", "content": prompt}],
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                json=payload,
                headers=_auth_headers(),
            )
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail="Cannot reach OpenRouter. Check your internet connection.",
        ) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="OpenRouter request timed out.",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter returned {response.status_code}: {response.text[:200]}",
        )

    data = response.json()
    return (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )


async def check_health() -> bool:
    """
    Lightweight reachability probe. Confirms the API key is present and
    that ``/models`` responds. Does NOT trigger any inference.
    """
    if not is_configured():
        return False
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            response = await client.get(
                f"{OPENROUTER_BASE_URL}/models",
                headers=_auth_headers(),
            )
        return response.status_code == 200
    except Exception:
        return False
