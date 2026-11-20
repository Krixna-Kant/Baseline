from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from baseline_engine import THRESHOLD_VERSION, __version__

app = FastAPI(title="Baseline Engine", version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3100"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine_version": __version__, "threshold_version": THRESHOLD_VERSION}
