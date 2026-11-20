from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from baseline_engine import THRESHOLD_VERSION, __version__
from baseline_engine.evaluate import evaluate
from baseline_engine.schemas import EvaluateRequest, EvaluateResponse

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


@app.post("/evaluate", response_model=EvaluateResponse, response_model_by_alias=True)
def evaluate_endpoint(req: EvaluateRequest) -> EvaluateResponse:
    """Stateless: the app sends its full local history and receives the current decision."""
    return evaluate(req)
