from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.models import AuditLogEntry
from app.database.db import db

class AuditService:
    @staticmethod
    def log_action(
        user_id: str,
        user_role: str,
        action: str,
        entity_type: str,
        entity_id: str,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None
    ) -> AuditLogEntry:
        entry = AuditLogEntry(
            id=f"AUDIT_{len(db.audit_logs)+1:05d}",
            user_id=user_id,
            user_role=user_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            timestamp=datetime.now().isoformat(),
            old_value=old_value,
            new_value=new_value,
            reason=reason
        )
        db.audit_logs.insert(0, entry)
        return entry

audit_service = AuditService()
