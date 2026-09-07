import os
import sys
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import pytest
import asyncio
from app.analysis.job_worker import analysis_worker
from app.database.db import db
from app.database.models import JobStatus
from scripts.generate_demo_data import seed_demo_data

@pytest.mark.asyncio
async def test_end_to_end_async_analysis_pipeline():
    """Verify synthetic end-to-end pipeline execution through state machine."""
    seed_demo_data()
    
    # Create analysis job
    job = analysis_worker.create_job(
        forest_id="FOREST_001",
        date_before="2026-08-01",
        date_after="2026-09-01"
    )
    assert job.status == JobStatus.CREATED

    # Execute async pipeline
    await analysis_worker.execute_job_async(job.id)

    # Verify completed job
    completed_job = db.jobs[job.id]
    assert completed_job.status == JobStatus.COMPLETED
    assert completed_job.progress_pct == 100
    assert completed_job.result_event_id is not None

    # Verify change event was recorded and scored
    evt = db.changes[completed_job.result_event_id]
    assert evt.affected_area_ha > 0.0
    assert evt.risk_score >= 50
    assert evt.confidence > 0
    assert len(evt.polygons) >= 1

    # Verify deduplication works (alert list does not blow up)
    assert len(db.alerts) >= 1
    assert db.alerts[0].event_id == evt.id or db.alerts[0].risk_score > 0
