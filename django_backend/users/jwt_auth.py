"""
django_backend/users/jwt_auth.py
JWT Token Generation, Signing, and Verification Utility.
"""

import os
import time
import jwt
from typing import Dict, Any

JWT_SECRET = os.environ.get("JWT_SECRET", "django-insecure-change-this-in-production-now")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_LIFETIME = 86400 * 1  # 24 hours
REFRESH_TOKEN_LIFETIME = 86400 * 7 # 7 days

def generate_jwt_tokens(user) -> Dict[str, Any]:
    """Generates signed JWT Access and Refresh tokens for a given User."""
    now = int(time.time())
    
    access_payload = {
        "token_type": "access",
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "plan": user.plan,
        "iat": now,
        "exp": now + ACCESS_TOKEN_LIFETIME,
    }
    
    refresh_payload = {
        "token_type": "refresh",
        "user_id": user.id,
        "iat": now,
        "exp": now + REFRESH_TOKEN_LIFETIME,
    }
    
    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "access": access_token,
        "refresh": refresh_token,
        "expires_in": ACCESS_TOKEN_LIFETIME,
        "token_type": "Bearer",
    }

_BLACKLISTED_TOKENS = set()

def blacklist_refresh_token(token: str) -> bool:
    """Blacklists a refresh token so it cannot be used again."""
    try:
        from trading.redis_cache import _get_redis_client
        client = _get_redis_client()
        if client:
            client.setex(f"jwt_blacklist:{token}", REFRESH_TOKEN_LIFETIME, "revoked")
        else:
            _BLACKLISTED_TOKENS.add(token)
        return True
    except Exception:
        _BLACKLISTED_TOKENS.add(token)
        return True

def is_token_blacklisted(token: str) -> bool:
    """Checks if a refresh token has been revoked."""
    if token in _BLACKLISTED_TOKENS:
        return True
    try:
        from trading.redis_cache import _get_redis_client
        client = _get_redis_client()
        if client and client.get(f"jwt_blacklist:{token}"):
            return True
    except Exception:
        pass
    return False

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decodes and verifies a JWT token. Raises ValueError on expiration or invalid signature."""
    if is_token_blacklisted(token):
        raise ValueError("JWT token has been revoked / blacklisted.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("JWT token has expired.")
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Invalid JWT token: {exc}")
