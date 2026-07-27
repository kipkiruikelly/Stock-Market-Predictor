"""
django_backend/users/jwt_auth.py
JWT Token Generation, Signing, and Verification Utility, and custom DRF Authentication class.
"""

import os
import time
import jwt
from typing import Dict, Any
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model

JWT_SECRET = os.environ.get("JWT_SECRET", "django-insecure-change-this-in-production-now")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_LIFETIME = 15 * 60  # 15 minutes as requested
REFRESH_TOKEN_LIFETIME = 86400 * 7 # 7 days

def generate_jwt_tokens(user) -> Dict[str, Any]:
    """Generates signed JWT Access and Refresh tokens for a given User."""
    now = int(time.time())
    
    access_payload = {
        "token_type": "access",
        "user_id": user.id,
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

class JWTAuthentication(BaseAuthentication):
    """Custom DRF Authentication Backend that decodes secure JWT Bearer tokens."""
    
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
            
        token = parts[1]
        try:
            payload = decode_jwt_token(token)
            if payload.get("token_type") != "access":
                raise AuthenticationFailed("Invalid token type (must be access token).")
                
            User = get_user_model()
            user = User.objects.filter(id=payload.get("user_id")).first()
            if not user:
                raise AuthenticationFailed("User not found.")
            if user.status != "active" or user.is_deleted:
                raise AuthenticationFailed("User account is inactive or has been deleted.")
                
            return (user, token)
        except ValueError as exc:
            raise AuthenticationFailed(str(exc))

def log_auth_event(user, action: str, detail: str = None, request = None):
    """Utility to seamlessly log any Identity and Access Management (IAM) events into ActivityLog."""
    try:
        from users.models import ActivityLog
        ip = None
        ua = None
        if request:
            # Extract client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
            # Extract User Agent
            ua = request.META.get('HTTP_USER_AGENT', '')[:200]
            
        ActivityLog.objects.create(
            user=user,
            action=action,
            detail=detail[:200] if detail else None,
            ip=ip,
            ua=ua
        )
    except Exception:
        pass
