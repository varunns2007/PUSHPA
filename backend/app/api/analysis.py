import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database.db import db
from app.database.models import AnalysisJob, JobStatus
from app.analysis.job_worker import analysis_worker

router = APIRouter(prefix="/analysis", tags=["Analysis Jobs"])

class CreateAnalysisJobRequest(BaseModel):
    forest_id: str
    date_before: str
    date_after: str

@router.post("/jobs", response_model=AnalysisJob)
async def submit_analysis_job(req: CreateAnalysisJobRequest, background_tasks: BackgroundTasks):
    if req.forest_id not in db.forests:
        raise HTTPException(status_code=404, detail="Forest area not found")
    
    job = analysis_worker.create_job(
        forest_id=req.forest_id,
        date_before=req.date_before,
        date_after=req.date_after
    )
    
    # Run async pipeline in background task
    background_tasks.add_task(analysis_worker.execute_job_async, job.id)
    return job

@router.get("/jobs", response_model=List[AnalysisJob])
def get_all_jobs():
    return list(db.jobs.values())

@router.get("/jobs/{job_id}", response_model=AnalysisJob)
def get_job_status(job_id: str):
    if job_id not in db.jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return db.jobs[job_id]
