# Baseline

A mobile-first PWA that builds a personal brain-health baseline, separates meaningful cognitive and functional change from normal variation, and routes people to prevention or clinician review. Screening and monitoring only; it never diagnoses. Hackathon focus: validation and local population performance.

Start with [`docs/README.md`](docs/README.md).

## Repository layout

| Folder | What | Stack |
|---|---|---|
| `web/` | The PWA (Arabic and English, right-to-left aware, installable, offline app shell) | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| `engine/` | Change engine: Fair layer, personal model, state rules, API | Python 3.11, FastAPI, NumPy, SciPy |
| `lab/` | Validation Lab: simulated cohort and metric pipeline | Python 3.11, uses `engine` |
| `docs/` | Plan, evidence register, pre-registered validation protocol, phases | Markdown |

## Run locally

Web app (http://localhost:3000, redirects to `/ar` or `/en` from browser language):

```powershell
cd web
npm install
npm run dev
```

The service worker only registers in production builds: `npm run build; npm run start`.

Engine and Lab (one shared virtual environment at the repo root):

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -e "engine[api,dev]" -e lab
.\.venv\Scripts\python -m pytest engine
.\.venv\Scripts\uvicorn baseline_engine.api:app --reload --port 8000
```
