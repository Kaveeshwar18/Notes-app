import redis

try:
    redis_client = redis.Redis(
        host="localhost",
        port=6379,
        decode_responses=True
    )
    redis_client.ping()
    print("✅ Redis connected")
except Exception:
    print("⚠️  Redis not available — caching disabled")
    redis_client = None
