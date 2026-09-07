type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

export function rateLimit(
  key: string,
  max = Number(process.env.RATE_LIMIT_MAX || 20),
  windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC || 60)
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  let bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, max - bucket.count),
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** テスト用 */
export function __resetRateLimitStore() {
  store.clear();
}
