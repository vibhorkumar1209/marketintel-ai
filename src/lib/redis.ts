import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false
  });

redis.on('error', (err) => {
  console.warn('Redis Connection Error:', err.message);
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// ─── JOB PROGRESS ─────────────────────────────────────────────────────────────

export async function setJobProgress(jobId: string, progress: {
  step: number;
  stepName: string;
  pct: number;
  status: string;
}) {
  try {
    await redis.set(`job:${jobId}:progress`, JSON.stringify(progress), 'EX', 86400);
  } catch (err) {
    console.warn(`Redis setJobProgress failed for ${jobId}:`, err);
  }
}

export async function getJobProgress(jobId: string) {
  try {
    const raw = await redis.get(`job:${jobId}:progress`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`Redis getJobProgress failed for ${jobId}:`, err);
    return null;
  }
}

// ─── STREAM EVENTS ────────────────────────────────────────────────────────────

export async function publishStreamEvent(jobId: string, event: object) {
  try {
    const key = `stream:${jobId}`;
    await redis.rpush(key, JSON.stringify(event));
    await redis.expire(key, 3600); // 1h TTL
  } catch (err) {
    console.warn(`Redis publishStreamEvent failed for ${jobId}:`, err);
  }
}

export async function drainStreamEvents(jobId: string): Promise<string[]> {
  try {
    const key = `stream:${jobId}`;
    const len = await redis.llen(key);
    if (len === 0) return [];
    const items = await redis.lrange(key, 0, len - 1);
    if (len > 0) await redis.ltrim(key, len, -1);
    return items;
  } catch (err) {
    console.warn(`Redis drainStreamEvents failed for ${jobId}:`, err);
    return [];
  }
}

// ─── REPORT CACHE ─────────────────────────────────────────────────────────────

export async function cacheReport(reportId: string, data: object) {
  try {
    await redis.set(`report:${reportId}`, JSON.stringify(data), 'EX', 86400);
  } catch (err) {
    console.warn(`Redis cacheReport failed for ${reportId}:`, err);
  }
}

export async function getCachedReport(reportId: string) {
  try {
    const raw = await redis.get(`report:${reportId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`Redis getCachedReport failed for ${reportId}:`, err);
    return null;
  }
}

// ─── RATE LIMITER (simple token bucket) ───────────────────────────────────────

export async function checkRateLimit(userId: string, limit = 5, windowSec = 3600): Promise<boolean> {
  try {
    const key = `rl:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
    return count <= limit;
  } catch (err) {
    console.warn(`Redis checkRateLimit failed for ${userId}:`, err);
    return true; // fail-open locally
  }
}
// ─── JOB LOCKING (Prevent Parallel Agents) ───────────────────────────────────

export async function acquireJobLock(jobId: string, ttlSec = 1200): Promise<boolean> {
  try {
    const key = `lock:job:${jobId}`;
    // SET with NX=true (Only if not exist) and EX=ttl (Expiration)
    const result = await redis.set(key, 'locked', 'EX', ttlSec, 'NX');
    return result === 'OK';
  } catch (err) {
    console.warn(`Redis acquireJobLock failed for ${jobId}:`, err);
    return true; // Fail-open to avoid total deadlock, but risky
  }
}

export async function releaseJobLock(jobId: string) {
  try {
    await redis.del(`lock:job:${jobId}`);
  } catch (err) {
    console.warn(`Redis releaseJobLock failed for ${jobId}:`, err);
  }
}
