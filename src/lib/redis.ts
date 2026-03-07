import { Redis } from '@upstash/redis';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// ─── JOB PROGRESS ─────────────────────────────────────────────────────────────

export async function setJobProgress(jobId: string, progress: {
  step: number;
  stepName: string;
  pct: number;
  status: string;
}) {
  await redis.set(`job:${jobId}:progress`, JSON.stringify(progress), { ex: 86400 });
}

export async function getJobProgress(jobId: string) {
  const raw = await redis.get(`job:${jobId}:progress`);
  return raw ? (raw as object) : null;
}

// ─── STREAM EVENTS ────────────────────────────────────────────────────────────

export async function publishStreamEvent(jobId: string, event: object) {
  const key = `stream:${jobId}`;
  // Append event to a Redis list; SSE route will poll and drain it
  await redis.rpush(key, JSON.stringify(event));
  await redis.expire(key, 3600); // 1h TTL
}

export async function drainStreamEvents(jobId: string): Promise<string[]> {
  const key = `stream:${jobId}`;
  const len = await redis.llen(key);
  if (len === 0) return [];
  const items = await redis.lrange(key, 0, len - 1);
  if (len > 0) await redis.ltrim(key, len, -1);
  return items as string[];
}

// ─── REPORT CACHE ─────────────────────────────────────────────────────────────

export async function cacheReport(reportId: string, data: object) {
  await redis.set(`report:${reportId}`, JSON.stringify(data), { ex: 86400 });
}

export async function getCachedReport(reportId: string) {
  const raw = await redis.get(`report:${reportId}`);
  return raw ? raw : null;
}

// ─── RATE LIMITER (simple token bucket) ───────────────────────────────────────

export async function checkRateLimit(userId: string, limit = 5, windowSec = 3600): Promise<boolean> {
  const key = `rl:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);
  return count <= limit;
}
