from __future__ import annotations

from fastapi import APIRouter

from app.demo.scenario import run_scenario

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/run-scenario")
def run():
    return run_scenario()
