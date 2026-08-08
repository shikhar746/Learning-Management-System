import { Redis } from "@upstash/redis"

/**
 * Server-Side Redis Caching Layer for Minnerva
 *
 * Uses Upstash Redis HTTP SDK (ideal for Next.js, Vercel & serverless).
 * Includes automatic in-memory TTL fallback when Redis environment variables are missing,
 * ensuring local development works seamlessly without requiring an active Redis cluster.
 */

let redisClient = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// Local in-memory TTL cache fallback for development
const memoryCache = new Map()

/**
 * Cache Wrapper Function:
 * 1. Checks Redis (or in-memory cache) for key.
 * 2. If hit, returns parsed JSON data instantly.
 * 3. If miss, executes fetchFn(), saves result to cache with TTL, and returns data.
 */
export async function getOrSetCache(key, ttlSeconds, fetchFn) {
  try {
    if (redisClient) {
      const cached = await redisClient.get(key)
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached
      }

      const freshData = await fetchFn()
      if (freshData !== null && freshData !== undefined) {
        await redisClient.set(key, JSON.stringify(freshData), { ex: ttlSeconds })
      }
      return freshData
    }

    // In-Memory Fallback
    const now = Date.now()
    const memEntry = memoryCache.get(key)
    if (memEntry && memEntry.expiry > now) {
      return memEntry.data
    }

    const freshData = await fetchFn()
    if (freshData !== null && freshData !== undefined) {
      memoryCache.set(key, {
        data: freshData,
        expiry: now + ttlSeconds * 1000,
      })
    }
    return freshData
  } catch (err) {
    console.warn(`[Redis Cache Warning] Cache read/write error for key "${key}":`, err.message)
    return fetchFn()
  }
}

/**
 * Invalidate a single cache key
 */
export async function invalidateCacheKey(key) {
  try {
    if (redisClient) {
      await redisClient.del(key)
    }
    memoryCache.delete(key)
  } catch (err) {
    console.warn(`[Redis Cache Warning] Invalidate error for key "${key}":`, err.message)
  }
}

/**
 * Invalidate multiple cache keys matching a pattern prefix
 */
export async function invalidateCachePattern(prefix) {
  try {
    if (redisClient) {
      const keys = await redisClient.keys(`${prefix}*`)
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    }
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key)
      }
    }
  } catch (err) {
    console.warn(`[Redis Cache Warning] Pattern invalidate error for "${prefix}":`, err.message)
  }
}

export { redisClient }
