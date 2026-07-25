"""
django_backend/core/redis_client.py
Thread-Safe Polyglot Redis Manager for Sub-1ms Caching & PubSub.

Provides low-latency in-memory state caching with automatic memory fallback
if Redis is offline or not installed.
"""

import os
import json
import logging
from typing import Any, Optional

logger = logging.getLogger("redis_client")

# In-memory dictionary fallback when Redis server is unreachable
_MEMORY_CACHE = {}

_redis_instance = None
_redis_checked = False


def _get_redis():
    """Lazy initializer for Redis client connection pool."""
    global _redis_instance, _redis_checked
    if _redis_checked:
        return _redis_instance

    _redis_checked = True
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    
    try:
        import redis
        client = redis.Redis.from_url(redis_url, socket_connect_timeout=1, socket_timeout=1)
        client.ping()
        _redis_instance = client
        logger.info("Connected to Polyglot Redis instance at %s", redis_url)
    except Exception as exc:
        logger.warning("Redis server unavailable (%s). Falling back to resilient in-memory cache.", exc)
        _redis_instance = None

    return _redis_instance


def cache_set(key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
    """Store value in Redis (or in-memory fallback) with optional TTL."""
    try:
        val_str = json.dumps(value)
        r = _get_redis()
        if r is not None:
            if ttl_seconds:
                r.setex(key, ttl_seconds, val_str)
            else:
                r.set(key, val_str)
            return True
    except Exception as exc:
        logger.warning("Redis set failed for %s: %s", key, exc)

    # In-memory fallback
    _MEMORY_CACHE[key] = value
    return True


def cache_get(key: str) -> Optional[Any]:
    """Retrieve value from Redis (or in-memory fallback)."""
    try:
        r = _get_redis()
        if r is not None:
            val_bytes = r.get(key)
            if val_bytes:
                return json.loads(val_bytes.decode("utf-8"))
    except Exception as exc:
        logger.warning("Redis get failed for %s: %s", key, exc)

    return _MEMORY_CACHE.get(key)


def cache_delete(key: str) -> bool:
    """Delete key from Redis and memory fallback."""
    try:
        r = _get_redis()
        if r is not None:
            r.delete(key)
    except Exception as exc:
        logger.warning("Redis delete failed for %s: %s", key, exc)

    _MEMORY_CACHE.pop(key, None)
    return True
