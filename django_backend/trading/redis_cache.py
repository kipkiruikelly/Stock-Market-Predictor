"""
django_backend/trading/redis_cache.py
In-memory Redis cache manager for sub-millisecond market quote & indicator data.
"""

import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("redis_cache")

_REDIS_CLIENT = None

def _get_redis_client():
    global _REDIS_CLIENT
    if _REDIS_CLIENT is not None:
        return _REDIS_CLIENT
        
    redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    try:
        import redis
        _REDIS_CLIENT = redis.Redis.from_url(redis_url, socket_connect_timeout=2)
        _REDIS_CLIENT.ping()
        logger.info("Connected to Redis cache at %s", redis_url)
        return _REDIS_CLIENT
    except Exception as exc:
        logger.warning("Redis server unavailable at %s: %s (falling back to memory)", redis_url, exc)
        _REDIS_CLIENT = False
        return False

def cache_market_quote(ticker: str, data: Dict[str, Any], ttl_seconds: int = 60) -> bool:
    """Caches raw price quote or indicators in Redis."""
    client = _get_redis_client()
    if not client:
        return False
    try:
        key = f"market_quote:{ticker.upper().strip()}"
        client.setex(key, ttl_seconds, json.dumps(data))
        return True
    except Exception as exc:
        logger.warning("Redis cache write failed for %s: %s", ticker, exc)
        return False

def get_cached_market_quote(ticker: str) -> Optional[Dict[str, Any]]:
    """Retrieves cached market quote from Redis in sub-milliseconds."""
    client = _get_redis_client()
    if not client:
        return None
    try:
        key = f"market_quote:{ticker.upper().strip()}"
        cached = client.get(key)
        if cached:
            return json.loads(cached)
        return None
    except Exception as exc:
        logger.warning("Redis cache read failed for %s: %s", ticker, exc)
        return None
