# KrishiBot — AI Agriculture Assistant

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-FF6B35?style=flat)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat)

> **An offline-first AI agricultural assistant for smallholder farmers in South Asia — powered by a local LLM, bilingual (English & বাংলা), no cloud, no API keys.**

KrishiBot helps farmers detect crop diseases from photos, ask farming questions in natural language, plan treatments over a 14-day calendar, check weather-driven disease risks, and share disease sightings with the community — all running **entirely on local hardware** via Ollama. No subscriptions, no internet required after setup, no data leaves the device.

Built as a Final Year Project to demonstrate how open-source LLMs can address real agricultural problems for users who can't rely on cloud services.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running the Project](#running-the-project)
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

### Crop Disease Detection
- Upload a leaf / crop photo → structured JSON disease diagnosis
- Filename-based crop hints feed the text model, avoiding heavy vision-model RAM requirements
- Severity staging (Early / Moderate / Severe) + confidence rating
- **Market context** — calculates financial viability: crop value, projected loss, treatment cost, net saving, ROI verdict
- **PDF report export** via ReportLab

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

## Acknowledgements

- [Ollama](https://ollama.com) — local LLM runtime
- [Qwen](https://github.com/QwenLM) — open-source models by Alibaba
- [Open-Meteo](https://open-meteo.com) — free weather API
- [FastAPI](https://fastapi.tiangolo.com) · [Next.js](https://nextjs.org) · [Tailwind CSS](https://tailwindcss.com)

---

> **Disclaimer:** KrishiBot is an educational project. For serious crop disease outbreaks or major farming decisions, always consult your local agricultural extension officer. The AI can make mistakes.

**Built with 🌱 for farmers.**
