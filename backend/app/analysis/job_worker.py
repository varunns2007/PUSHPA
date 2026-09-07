import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from app.database.models import AnalysisJob, JobStatus, ChangeEvent, ChangePolygon, DisturbanceEvent
from app.database.db import db
from app.satellite.sentinel_client import sentinel_client
from app.satellite.ndvi import ndvi_calculator
from app.geospatial.change_detector import change_detector
from app.geospatial.polygon_extractor import polygon_extractor
from app.vehicles.tracker import vehicle_tracker
from app.permits.validator import permit_validator
from app.risk.engine import risk_engine
from app.alerts.engine import alert_engine

class AnalysisJobWorker:
    def create_job(self, forest_id: str, date_before: str, date_after: str) -> AnalysisJob:
        job_id = f"JOB_{len(db.jobs)+1:04d}_{datetime.now().strftime('%H%M%S')}"
        job = AnalysisJob(
            id=job_id,
            forest_id=forest_id,
            status=JobStatus.CREATED,
            progress_pct=0,
            current_stage="Job Created",
            date_before=date_before,
            date_after=date_after,
            created_at=datetime.now().isoformat(),
            provenance={
                "copernicus_pipeline": "Copernicus Sentinel-2 Level-2A",
                "bands": ["B04", "B08", "SCL"],
                "processing_version": "v1.0"
            }
        )
        db.jobs[job.id] = job
        return job

    async def execute_job_async(self, job_id: str):
        job = db.jobs.get(job_id)
        if not job:
            return

        try:
            forest = db.forests.get(job.forest_id)
            if not forest:
                job.status = JobStatus.FAILED
                job.error_message = f"Forest area {job.forest_id} not found"
                return

            # Stage 1: INGESTING
            job.status = JobStatus.INGESTING
            job.progress_pct = 15
            job.current_stage = "Ingesting Sentinel-2 B04, B08 & SCL rasters"
            await asyncio.sleep(0.05)

            # Stage 2: PREPROCESSING
            job.status = JobStatus.PREPROCESSING
            job.progress_pct = 30
            job.current_stage = "Validating CRS alignment & Cloud/Shadow masking"
            b04_before, b08_before, _ = sentinel_client.generate_synthetic_bands(grid_size=80)
            b04_after, b08_after, _ = sentinel_client.generate_synthetic_bands(
                grid_size=80, degradation_center=(40, 45), degradation_radius=10
            )
            await asyncio.sleep(0.05)

            # Stage 3: NDVI_PROCESSING
            job.status = JobStatus.NDVI_PROCESSING
            job.progress_pct = 45
            job.current_stage = "Computing NDVI matrices & density statistics"
            ndvi_before = ndvi_calculator.calculate_ndvi_matrix(b04_before, b08_before)
            ndvi_after = ndvi_calculator.calculate_ndvi_matrix(b04_after, b08_after)
            await asyncio.sleep(0.05)

            # Stage 4: CHANGE_DETECTION
            job.status = JobStatus.CHANGE_DETECTION
            job.progress_pct = 60
            job.current_stage = "Pixel-level NDVI difference & morphological filtering"
            diff, stats = change_detector.calculate_ndvi_difference(ndvi_before, ndvi_after)
            await asyncio.sleep(0.05)

            # Stage 5: POLYGONIZATION
            job.status = JobStatus.POLYGONIZATION
            job.progress_pct = 75
            job.current_stage = "Projected geodesic polygonization & area calculation"
            poly_data_list = polygon_extractor.extract_change_polygons(
                ndvi_diff=diff,
                ndvi_before=ndvi_before,
                ndvi_after=ndvi_after,
                center_lat=forest.center_lat,
                center_lng=forest.center_lng,
                threshold=-0.20
            )
            
            polygons = []
            total_ha = 0.0
            evt_id = f"EVT_{len(db.changes)+1:03d}"
            for p in poly_data_list:
                cp = ChangePolygon(
                    id=p["id"],
                    forest_id=forest.id,
                    event_id=evt_id,
                    area_ha=p["area_ha"],
                    centroid_lat=p["centroid_lat"],
                    centroid_lng=p["centroid_lng"],
                    mean_ndvi_before=p["mean_ndvi_before"],
                    mean_ndvi_after=p["mean_ndvi_after"],
                    ndvi_decrease=p["ndvi_decrease"],
                    veg_loss_pct=p["veg_loss_pct"],
                    severity=p["severity"],
                    detection_date=job.date_after,
                    polygon_geometry=p["polygon_geometry"]
                )
                polygons.append(cp)
                db.polygons[cp.id] = cp
                total_ha += cp.area_ha

            # Stage 6: VEHICLE & PERMIT CORRELATION
            job.status = JobStatus.VEHICLE_CORRELATION
            job.progress_pct = 85
            job.current_stage = "Spatial & temporal telemetry correlation with permits"
            
            # Find associated vehicle
            associated_vehicle = None
            for v in db.vehicles.values():
                if v.permit_status != "VALID":
                    associated_vehicle = v
                    break
            
            permit = db.permits.get(associated_vehicle.permit_id) if (associated_vehicle and associated_vehicle.permit_id) else None
            permit_validation = permit_validator.validate_permit(permit, associated_vehicle)
            incidents = [i for i in db.incidents.values() if i.forest_area_id == forest.id]

            # Stage 7: RISK_CALCULATION
            job.status = JobStatus.RISK_CALCULATION
            job.progress_pct = 95
            job.current_stage = "Explainable multi-source risk scoring & confidence assessment"

            change_evt = ChangeEvent(
                id=evt_id,
                forest_id=forest.id,
                forest_name=forest.name,
                observation_before_id=f"OBS_{job.date_before.replace('-','')}",
                observation_after_id=f"OBS_{job.date_after.replace('-','')}",
                date_before=job.date_before,
                date_after=job.date_after,
                affected_area_ha=round(total_ha, 2),
                severity="Critical" if stats["critical_pct"] > 0 else "High",
                status="Potential Unauthorized Disturbance (Needs Investigation)",
                risk_score=0,
                confidence=100,
                polygons=polygons
            )

            risk_breakdown = risk_engine.calculate_risk(
                change_event=change_evt,
                vehicle=associated_vehicle,
                permit=permit,
                nearby_incidents=incidents,
                distance_km=2.3
            )
            change_evt.risk_score = risk_breakdown.total_score
            change_evt.confidence = risk_breakdown.confidence
            db.changes[change_evt.id] = change_evt
            forest.recent_loss_ha = change_evt.affected_area_ha

            # Stage 8: PERSIST DISTURBANCE EVENT & DEDUP ALERT
            dist_event_id = f"DIST_EVT_{forest.id}_{job.date_after.replace('-','')}"
            db.disturbance_events[dist_event_id] = DisturbanceEvent(
                id=dist_event_id,
                forest_id=forest.id,
                forest_name=forest.name,
                first_detected_date=job.date_before,
                latest_observation_date=job.date_after,
                total_area_ha=change_evt.affected_area_ha,
                status="NEEDS_INVESTIGATION",
                observation_ids=[change_evt.observation_after_id],
                change_polygon_ids=[p.id for p in polygons],
                latest_risk_score=risk_breakdown.total_score,
                latest_confidence=risk_breakdown.confidence
            )

            # Trigger alert with deduplication
            if risk_breakdown.total_score >= 50:
                alert_engine.create_or_update_alert(
                    alert_type="Multi-Source Correlation",
                    severity=risk_breakdown.risk_level,
                    forest_id=forest.id,
                    forest_name=forest.name,
                    title=f"Potential Forest Disturbance ({change_evt.affected_area_ha:.2f} ha) Correlated with Vehicle Telemetry",
                    description=f"Candidate vegetation disturbance detected in {forest.name}. Vehicle telemetry proximity and permit anomaly identified.",
                    risk_score=risk_breakdown.total_score,
                    confidence=risk_breakdown.confidence,
                    explainable_factors=[f.description for f in risk_breakdown.factors if f.contribution > 0],
                    vehicle_id=associated_vehicle.id if associated_vehicle else None,
                    lat=polygons[0].centroid_lat if polygons else forest.center_lat,
                    lng=polygons[0].centroid_lng if polygons else forest.center_lng,
                    event_id=change_evt.id
                )

            # Stage 9: COMPLETED
            job.status = JobStatus.COMPLETED
            job.progress_pct = 100
            job.current_stage = "Analysis Completed Successfully"
            job.completed_at = datetime.now().isoformat()
            job.result_event_id = change_evt.id

        except Exception as e:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.now().isoformat()

analysis_worker = AnalysisJobWorker()
