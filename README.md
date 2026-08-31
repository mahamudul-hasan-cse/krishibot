# KrishiBot — AI Agriculture Assistant

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-FF6B35?style=flat)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat)

> **An offline-first AI agricultural assistant for smallholder farmers in South Asia — powered by a local LLM, bilingual (English & বাংলা), no cloud, no API keys.**

KrishiBot helps farmers detect crop diseases from photos, ask farming questions in natural language, plan treatments over a 14-day calendar, check weather-driven disease risks, and share disease sightings with the community — all running **entirely on local hardware** via Ollama. No subscriptions, no internet required after setup, no data leaves the device.

Built as a Final Year Project to demonstrate how open-source LLMs can address real agricultural problems for users who can't rely on cloud services.

Demo video link: https://youtu.be/Dzb5Jo8-dI0?si=8cljXC9g7PEnaDNx        
Live Project:
https://krishibot-sandy-three.vercel.app
---
## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running the Project](#running-the-project)
- [Run Backend with Docker](#run-backend-with-docker)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Conversational AI
- **Bilingual chat** — English and Bangla, toggle instantly in the UI
- **Streaming responses** via Server-Sent Events (SSE) for token-by-token feedback
- **Multi-session chat history** — sidebar with persisted conversations, auto-titled from the first message
- **Voice input** — Web Speech API support for hands-free questions
- **Individual and bulk delete** for chat history
  
<img width="1672" height="941" alt="Krishi-bot-image" src="https://github.com/user-attachments/assets/f70aaae1-3c34-40c2-80d9-4eaccf4f1bc7" />

### Crop Disease Detection
- Upload a leaf / crop photo → structured JSON disease diagnosis
- Filename-based crop hints feed the text model, avoiding heavy vision-model RAM requirements
- Severity staging (Early / Moderate / Severe) + confidence rating
- **Market context** — calculates financial viability: crop value, projected loss, treatment cost, net saving, ROI verdict
- **PDF report export** via ReportLab

<img width="1672" height="941" alt="Krishi-bot-image2" src="https://github.com/user-attachments/assets/a58bfe47-69ab-459b-9321-e0d1d394fa95" />

### Treatment Calendar
- Auto-generated **14-day treatment schedule** per detected disease
- Day-by-day action items with products, timing, and notes
- Robust JSON fallback if the LLM output is malformed

### Crop Advisory
- Topic-based guidance for 5 crops (rice, tomato, potato, wheat, jute) across 5 topics (irrigation, fertilizer, pest control, disease prevention, harvest)

### Weather & Risk Alerts
- Open-Meteo integration (no API key needed)
- Heuristic disease-risk scoring (fungal/bacterial) based on 48h forecast

### Community Disease Board
- Anonymous crowd-sourced disease reporting
- Division-level aggregation for all 8 Bangladesh divisions
- Stats dashboard: top diseases, top locations, recent reports

### UI / UX
- **Dark "agriculture" theme toggle** — earthy soil-green palette, persisted per device
- Responsive mobile-first layout (phone, tablet, desktop)
- Skeleton loaders, error states with retry, placeholder empty states
- Accessible keyboard navigation

---

## Tech Stack

| Layer         | Technology                                             |
|---------------|--------------------------------------------------------|
| **Frontend**  | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Lucide icons |
| **Backend**   | FastAPI 0.109 · SQLAlchemy 2 · Pydantic v2 · httpx (async) |
| **LLM**       | Ollama — `qwen2.5:3b` (text) · `qwen2.5vl:3b` (vision, optional) |
| **Database**  | SQLite (default) · PostgreSQL supported via env var   |
| **PDF**       | ReportLab                                              |
| **Weather**   | Open-Meteo (free, no key)                              |
| **Streaming** | Server-Sent Events for token-by-token chat            |

---

## Screenshots

> _Add screenshots of the Chat (with sidebar & dark mode), Analyze, Advisory, and Dashboard pages here._

---

## Prerequisites

| Tool      | Version  | Link                        |
|-----------|----------|-----------------------------|
| Python    | 3.11+    | https://python.org          |
| Node.js   | 18+      | https://nodejs.org          |
| Ollama    | latest   | https://ollama.com          |
| Git       | any      | https://git-scm.com         |

**Hardware:** 8 GB RAM minimum (16 GB recommended), ~5 GB disk for models. A GPU with 4 GB+ VRAM speeds inference but is not required.

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/mahamudul-hasan-cse/krishibot.git
cd krishibot
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Activate — Windows
venv\Scripts\activate
# Activate — macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env template
cp .env.example .env
```

### 3. Frontend setup

```bash
cd ../frontend

npm install

# Create local env
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### 4. Pull the Ollama model

```bash
ollama pull qwen2.5:3b    # ~2 GB — required for chat, analysis, advisory, treatment
```

> The vision model (`qwen2.5vl:3b`) is optional — image analysis uses filename-based crop hints with the text model to keep RAM requirements low.

---

## Running the Project

You need **three terminals** (Ollama + backend + frontend).

### Terminal 1 — Ollama

```bash
ollama serve
```
Default URL: `http://localhost:11434`

### Terminal 2 — FastAPI backend

```bash
cd backend
# activate venv first (see above)
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- API: `http://localhost:8000`
- Interactive Swagger docs: `http://localhost:8000/docs`

### Terminal 3 — Next.js frontend

```bash
cd frontend
npm run dev
```
App: `http://localhost:3000`

---

## Run Backend with Docker

A `Dockerfile` and `docker-compose.yml` are included so you can run the FastAPI backend in a container — useful for production deployments (DigitalOcean, AWS, Render, etc.) and for testing the exact image you'll ship.

### What's in the box

| File | Purpose |
|---|---|
| [`backend/Dockerfile`](backend/Dockerfile) | Multi-stage Python 3.11-slim image; installs **CPU-only PyTorch** (~200 MB instead of ~800 MB), runs as non-root `krishi` user, includes a healthcheck |
| [`backend/.dockerignore`](backend/.dockerignore) | Excludes `venv/`, `__pycache__/`, `*.db`, `.env` — keeps the image small and free of secrets |
| [`docker-compose.yml`](docker-compose.yml) | Orchestrates the backend container, mounts a host `./data/` volume for SQLite persistence, binds port 8000 to localhost only |

### Prerequisites

- Docker Desktop (Windows / macOS) or Docker Engine + Compose plugin (Linux)
- ~2 GB free disk space for the image

### Build and run

From the **repo root**:

```bash
docker compose up --build
```

First build takes ~5-10 minutes (downloads `python:3.11-slim`, CPU PyTorch, and your Python deps). Subsequent builds are seconds thanks to layer caching.

When you see `KrishiBot API started successfully.` and `Uvicorn running on http://0.0.0.0:8000`, the backend is ready.

Test it:

```bash
curl http://localhost:8000/
curl http://localhost:8000/health
```

Or open **http://localhost:8000/docs** for the Swagger UI.

### Run in the background

```bash
docker compose up -d --build      # detached
docker compose logs -f backend    # tail logs
docker compose down               # stop & remove
```

### How it's wired

```
┌───────────────────────────────────────────────────────────┐
│ Host (your laptop / droplet)                              │
│                                                            │
│  ./data/krishibot.db   ◄───────┐                          │
│                                │  volume mount             │
│  127.0.0.1:8000  ◄────┐        │                          │
│                       │        │                          │
│  ┌────────────────────▼────────▼──────────────────────┐   │
│  │ Container: krishibot-backend                       │   │
│  │   uvicorn main:app --workers 2  →  port 8000       │   │
│  │   /app/data/krishibot.db (SQLite, persisted)       │   │
│  │   EfficientNet-B0 weights baked into image         │   │
│  │   Reads CORS_ORIGINS, OLLAMA_URL from env          │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

- **Port binding**: `127.0.0.1:8000:8000` — the API is only reachable from the host. In production, put a reverse proxy (Caddy / nginx) in front for HTTPS.
- **Data volume**: `./data/` on the host maps to `/app/data/` inside the container, so the SQLite DB survives container rebuilds.
- **Non-root user**: container runs as UID 1000 (`krishi`) for safety.
- **Healthcheck**: Docker probes `GET /` every 30s; the container is marked `unhealthy` if the API stops responding.

### Configuring the container

Override defaults via environment variables (set them in your shell or in a `.env` file next to `docker-compose.yml`):

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed frontend origins. Set to your deployed frontend URL in prod. |
| `OLLAMA_URL` | `http://localhost:11434` | Where to reach Ollama. The container itself doesn't run Ollama — point this at a host/remote Ollama instance, or swap `services/ollama_service.py` for a hosted LLM API (Groq, OpenRouter, etc.). |
| `OLLAMA_TEXT_MODEL` | `qwen2.5:3b` | Model name passed to Ollama. |
| `DATABASE_URL` | `sqlite:////app/data/krishibot.db` | Override to point at PostgreSQL in production. |
| `DEBUG` | `False` | Set `True` for verbose error output during development. |

### Production deployment notes

When deploying to a cloud VM (DigitalOcean droplet, AWS EC2, etc.):

1. **PyTorch wheel**: the Dockerfile already pulls the CPU-only build via `--extra-index-url https://download.pytorch.org/whl/cpu`. Keep this — the GPU build is ~600 MB larger and won't run on a CPU droplet.
2. **Database**: SQLite + a host volume works for low traffic. For multi-worker setups under load, switch to managed PostgreSQL by overriding `DATABASE_URL`.
3. **Ollama is not in the container.** It's a separate process and `qwen2.5:3b` needs ~3-4 GB RAM by itself. Either run Ollama on a separate machine and point `OLLAMA_URL` at it, or replace the LLM client with a hosted API.
4. **Reverse proxy**: terminate TLS at Caddy / nginx and proxy to `127.0.0.1:8000`. Don't expose port 8000 publicly.
5. **Swap**: on a 2 GB droplet, add 2 GB swap before first build — PyTorch installation can briefly spike past available RAM.

---

## Project Structure

```
krishibot/
├── backend/                       FastAPI + Ollama + SQLite
│   ├── main.py                    App entry, lifespan, CORS
│   ├── database.py                SQLAlchemy engine & session
│   ├── routers/
│   │   ├── chat.py                SSE streaming chat endpoints
│   │   ├── analyze.py             Image upload & disease analysis
│   │   ├── advisory.py            Crop × topic advisory
│   │   ├── treatment.py           14-day treatment calendar
│   │   ├── weather.py             Open-Meteo risk alerts
│   │   ├── community.py           Anonymous disease reports
│   │   └── stats.py               Dashboard aggregations
│   ├── services/
│   │   ├── ollama_service.py      Async Ollama HTTP client
│   │   ├── prompt_builder.py      All LLM prompt templates (EN + BN)
│   │   ├── image_service.py       PIL preprocessing + base64
│   │   ├── weather_service.py     Forecast + disease-risk heuristics
│   │   ├── market_service.py      Crop prices, ROI calculation
│   │   └── pdf_service.py         ReportLab PDF generation
│   ├── models/database.py         SQLAlchemy ORM models
│   ├── schemas/schemas.py         Pydantic request/response schemas
│   └── requirements.txt
│
├── frontend/                      Next.js 14 (App Router)
│   ├── app/
│   │   ├── page.tsx               Landing page
│   │   ├── chat/page.tsx          Chat with sidebar + session history
│   │   ├── analyze/page.tsx       Image upload + treatment calendar
│   │   ├── advisory/page.tsx      Crop × topic selector
│   │   ├── community/page.tsx     Disease reports & stats
│   │   ├── dashboard/page.tsx     Admin analytics
│   │   ├── about/page.tsx
│   │   └── layout.tsx             Root layout + theme init
│   ├── components/
│   │   ├── Navbar.tsx             Nav + theme toggle
│   │   ├── ThemeToggle.tsx        Light ↔ dark-agriculture toggle
│   │   ├── ChatInterface.tsx      SSE streaming chat UI
│   │   ├── ChatSidebar.tsx        Session list with delete controls
│   │   ├── MessageBubble.tsx      Individual chat message
│   │   ├── ImageUploader.tsx      Drag-and-drop image upload
│   │   ├── DiseaseReportCard.tsx
│   │   ├── TreatmentCalendar.tsx
│   │   ├── MarketContextCard.tsx
│   │   ├── WeatherRiskCard.tsx
│   │   └── CommunityStatsSection.tsx
│   └── lib/
│       ├── api.ts                 All API client functions + types
│       └── chatSessions.ts        localStorage session management
│
├── .gitignore
└── README.md                      (this file)
```

---

## API Reference

Full interactive docs at `http://localhost:8000/docs` when the backend is running.

### Chat
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | `/api/chat/message`               | Send message, stream SSE reply |
| GET    | `/api/chat/history/{session_id}`  | Retrieve message history       |
| DELETE | `/api/chat/session/{session_id}`  | Delete a chat session          |

### Disease Analysis
| Method | Endpoint                    | Description                       |
|--------|-----------------------------|-----------------------------------|
| POST   | `/api/analyze/image`        | Upload image, get disease JSON    |
| POST   | `/api/analyze/report/pdf`   | Generate downloadable PDF report  |

### Treatment Calendar
| Method | Endpoint                                | Description                      |
|--------|-----------------------------------------|----------------------------------|
| POST   | `/api/treatment/generate`               | Generate 14-day schedule         |
| GET    | `/api/treatment/schedule/{disease_name}`| Retrieve latest cached schedule  |

### Advisory
| Method | Endpoint                 | Description                |
|--------|--------------------------|----------------------------|
| GET    | `/api/advisory/crops`    | List supported crops       |
| GET    | `/api/advisory/topics`   | List advisory topics       |
| POST   | `/api/advisory/query`    | Generate crop × topic guide|

### Weather
| Method | Endpoint                | Description                         |
|--------|-------------------------|-------------------------------------|
| GET    | `/api/weather/risk`     | Forecast + disease risk heuristics  |

### Community
| Method | Endpoint                      | Description                  |
|--------|-------------------------------|------------------------------|
| GET    | `/api/community/divisions`    | List Bangladesh divisions    |
| POST   | `/api/community/report`       | Submit anonymous report      |
| GET    | `/api/community/reports`      | List reports (filterable)    |
| GET    | `/api/community/stats`        | Aggregated statistics        |

### System
| Method | Endpoint     | Description                      |
|--------|--------------|----------------------------------|
| GET    | `/`          | Root health check                |
| GET    | `/health`    | API + Ollama connectivity status |
| GET    | `/api/stats/overview` | System-wide metrics     |

---

## Environment Variables

### Backend (`backend/.env`)

```bash
# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=qwen2.5:3b
OLLAMA_VISION_MODEL=qwen2.5vl:3b

# Database — SQLite default
DATABASE_URL=sqlite:///./krishibot.db

# To use PostgreSQL instead:
# DATABASE_URL=postgresql://user:password@localhost:5432/krishibot

DEBUG=True
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Roadmap

- [ ] More crops: onion, garlic, brinjal, chilli, mustard
- [ ] Multilingual expansion: Hindi, Tamil
- [ ] Offline PWA with service worker
- [ ] User accounts with persistent profiles
- [ ] Fine-tune on Bangladesh / India-specific agricultural datasets
- [ ] Whisper-based speech-to-text (better than Web Speech for Bangla)
- [ ] Photo-based pest identification (not just diseases)
- [ ] SMS fallback for low-connectivity regions

---

## Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

For major changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT License — free to use, modify, and distribute with attribution.

---
## 👤 Author

**Md. Mahamudul Hasan**

- GitHub: [@mahamudul-hasan-cse](https://github.com/mahamudul-hasan-cse)
---

## Acknowledgements

- [Ollama](https://ollama.com) — local LLM runtime
- [Qwen](https://github.com/QwenLM) — open-source models by Alibaba
- [Open-Meteo](https://open-meteo.com) — free weather API
- [FastAPI](https://fastapi.tiangolo.com) · [Next.js](https://nextjs.org) · [Tailwind CSS](https://tailwindcss.com)

---

> **Disclaimer:** KrishiBot is an educational project. For serious crop disease outbreaks or major farming decisions, always consult your local agricultural extension officer. The AI can make mistakes.

**Built with 🌱 for farmers.**
