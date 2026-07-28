"""
LLM router — picks between local Ollama and cloud Gemini, exposing
the same ``chat_stream`` / ``analyze_image`` interface as either.

Routing policy
--------------
Per request, try Ollama first. If it raises a connection-style error
(503 / 504 from ``ollama_service``), fall back to Gemini.

To avoid hammering an unreachable Ollama on every request, the result
of the most recent attempt is cached for ``_HEALTH_TTL`` seconds — when
Ollama is known-down we skip straight to Gemini without paying the
TCP-connect timeout.

Both providers may still fail (e.g. rate limits, missing API key); in
that case the underlying HTTPException is propagated and the router
returns a 503 to the caller.
"""

import logging
import time
from collections.abc import AsyncGenerator

from fastapi import HTTPException

from services import gemini_service, ollama_service

logger = logging.getLogger(__name__)

# Cache the last "is Ollama reachable?" result for this many seconds.
# Short enough to recover quickly when Ollama comes back; long enough
# to avoid retrying a known-dead Ollama on every single request.
_HEALTH_TTL = 30.0

# (timestamp, is_healthy) — None means "never checked".
_ollama_state: tuple[float, bool] | None = None


def _ollama_should_be_tried() -> bool:
    """
    Decide whether to attempt Ollama at all. Returns True unless we
    recently confirmed it's down within the TTL window.
    """
    global _ollama_state
    if _ollama_state is None:
        return True
    ts, healthy = _ollama_state
    if (time.time() - ts) > _HEALTH_TTL:
        # Cached entry expired — attempt Ollama again to refresh state.
        return True
    return healthy


def _record_ollama(healthy: bool) -> None:
    global _ollama_state
    _ollama_state = (time.time(), healthy)


def _is_connection_error(exc: HTTPException) -> bool:
    """Treat 503/504 as 'Ollama is down — try fallback'."""
    return exc.status_code in (502, 503, 504)


# ---------------------------------------------------------------------------
# Public mirrored interface
# ---------------------------------------------------------------------------


async def chat_stream(
    messages: list[dict[str, str]],
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    """
    Stream tokens from whichever provider answers first.

    Strategy: if Ollama looks healthy, try it. If it fails with a
    connection-style error BEFORE yielding any tokens, fall back to
    Gemini. Once we've yielded a token from a provider, we commit
    to that stream — no mid-stream switching.
    """
    if _ollama_should_be_tried():
        try:
            yielded_any = False
            async for token in ollama_service.chat_stream(messages, system_prompt):
                yielded_any = True
                yield token
            _record_ollama(True)
            return
        except HTTPException as exc:
            if _is_connection_error(exc) and not yielded_any:
                _record_ollama(False)
                logger.info("Ollama unavailable (%s) — falling back to Gemini.", exc.detail)
            else:
                # Either we already streamed tokens, or it's a real error
                # we shouldn't paper over (e.g. malformed payload).
                raise

    # --- Fallback: Gemini ---
    if not gemini_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="LLM unavailable: Ollama is unreachable and no Gemini key configured.",
        )

    async for token in gemini_service.chat_stream(messages, system_prompt):
        yield token


async def analyze_image(base64_image: str, prompt: str) -> str:
    """
    Non-streaming chat completion with the same fallback logic.
    """
    if _ollama_should_be_tried():
        try:
            response = await ollama_service.analyze_image(base64_image, prompt)
            _record_ollama(True)
            return response
        except HTTPException as exc:
            if _is_connection_error(exc):
                _record_ollama(False)
                logger.info("Ollama unavailable (%s) — falling back to Gemini.", exc.detail)
            else:
                raise

    if not gemini_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="LLM unavailable: Ollama is unreachable and no Gemini key configured.",
        )

    return await gemini_service.analyze_image(base64_image, prompt)


async def check_health() -> dict[str, object]:
    """
    Report the reachability of both providers. Used by the /health
    endpoint to give operators a clear view of the LLM situation.
    """
    ollama_ok = await ollama_service.check_ollama_health()
    gemini_ok = await gemini_service.check_health()

    if ollama_ok:
        active = "ollama"
    elif gemini_ok:
        active = "gemini"
    else:
        active = "none"

    return {
        "ollama": ollama_ok,
        "gemini": gemini_ok,
        "gemini_configured": gemini_service.is_configured(),
        "active_provider": active,
    }
