"""
fastapi_service/auth.py
FastAPI JWT Authentication Security Dependency.
"""

import sys
from pathlib import Path
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

security = HTTPBearer(auto_error=False)

async def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verifies signed JWT access token in the Authorization: Bearer <token> header."""
    if not credentials:
        # Fallback for open routes or raise 401
        return {"anonymous": True}
        
    token = credentials.credentials
    try:
        from django_backend.users.jwt_auth import decode_jwt_token
        payload = decode_jwt_token(token)
        return payload
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
