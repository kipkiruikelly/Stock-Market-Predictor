from rest_framework.response import Response
from datetime import datetime
import uuid

class StandardAPIResponse(Response):
    """
    Standard API Response class to enforce the enterprise envelope format across all REST responses.
    """
    def __init__(self, data=None, status=None, message="Operation completed successfully.", success=True, errors=None, **kwargs):
        now = datetime.utcnow().isoformat() + "Z"
        request_id = str(uuid.uuid4())
        
        envelope = {
            "success": success,
            "message": message,
            "data": data if data is not None else {},
            "meta": {
                "request_id": request_id,
                "timestamp": now,
                "version": "v1"
            }
        }
        
        if not success:
            envelope["errors"] = errors if errors is not None else {}
            
        super().__init__(data=envelope, status=status, **kwargs)
