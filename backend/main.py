"""
KrishiBot API — application entry point.

Startup sequence:
1. Load environment variables from .env
2. Configure logging
3. Create FastAPI app with CORS
4. Register routers
5. On lifespan start: initialise database tables, log readiness
"""

import logging
import os
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env before any other local imports so os.getenv() calls in service
# modules pick up the correct values at import time.
load_dotenv()

from database import init_db                          # noqa: E402
from routers import advisory, analyze, chat, community, weather  # noqa: E402
from routers.treatment import router as treatment_router  # noqa: E402
from routers.stats import router as stats_router  # noqa: E402
from services.llm_service import check_health as check_llm_health  # noqa: E402

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("krishibot")


# ---------------------------------------------------------------------------
# Lifespan (replaces deprecated @app.on_event("startup"))
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # ---- startup ----
    logger.info("Initialising database tables…")
    init_db()

    # Pre-load the vision classifier on startup
    try:
        from services.plant_classifier import load_model
        load_model()
        logger.info("Plant vision classifier loaded")
    except Exception as e:
        logger.warning(f"Vision classifier not loaded: {e}")

    logger.info("KrishiBot API started successfully.")
    yield
    # ---- shutdown ----
    logger.info("KrishiBot API shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="KrishiBot API",
    version="1.0.0",
    description=(
        "AI-powered agricultural assistant for South Asian farmers. "
        "Provides crop disease analysis, irrigation/fertilizer advisory, "
        "and conversational farming support via local LLM (Ollama)."
    ),
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

# Comma-separated list of allowed origins for production, e.g.:
#   CORS_ORIGINS=https://krishibot.vercel.app,https://www.krishibot.com
_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    # Also accept any localhost port so dev still works regardless of Next.js port.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(chat.router)
app.include_router(analyze.router)
app.include_router(advisory.router)
app.include_router(weather.router)
app.include_router(community.router)
app.include_router(treatment_router)
app.include_router(stats_router)


# ---------------------------------------------------------------------------
# Core endpoints
# ---------------------------------------------------------------------------


@app.get("/", tags=["Meta"], summary="Root health check")
async def root() -> dict[str, str]:
    """Lightweight ping to confirm the API process is alive."""
    return {"status": "ok", "message": "KrishiBot API is running"}


@app.get("/health", tags=["Meta"], summary="Detailed health check including LLM provider status")
async def health_check() -> dict[str, object]:
    """
    Report API health plus the reachability of both LLM providers.

    Response fields:
    - ``api``: always ``"ok"`` if this endpoint responds.
    - ``ollama``: ``true`` if local Ollama responds.
    - ``gemini``: ``true`` if Gemini responds with a valid API key.
    - ``gemini_configured``: ``true`` if GEMINI_API_KEY is set.
    - ``active_provider``: which one will be used right now ("ollama", "gemini", or "none").
    """
    llm = await check_llm_health()
    return {"api": "ok", **llm}
