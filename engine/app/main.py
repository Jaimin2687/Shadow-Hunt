from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from app.models.state import UserBehaviorWindow
from app.models.scorer import AnomalyScorer
from app.features.peer_group import PeerGroupManager

# Global state
USER_STATES: Dict[str, UserBehaviorWindow] = {}
SCORER = AnomalyScorer()
PEER_MANAGER = PeerGroupManager()
RESOURCE_FREQ: Dict[str, int] = {}

app = FastAPI(title="SHADOW-HUNT Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.score import router as score_router
app.include_router(score_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    print("Generating synthetic baseline for PyOD...")
    X_train = SCORER.generate_synthetic_baseline()
    print("Fitting baseline models...")
    SCORER.fit_baseline(X_train)
    print("Startup complete. Models fitted and ready.")
