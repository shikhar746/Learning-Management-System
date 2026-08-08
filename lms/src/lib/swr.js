/**
 * SWR Fetcher & Caching Utilities for Minerva
 *
 * SWR provides:
 * - Automatic request deduplication (same URL fetched by 5 components = 1 network request)
 * - Stale-While-Revalidate (shows cached data instantly, refreshes in background)
 * - Focus revalidation (auto-refreshes when user tabs back)
 * - Error retry with exponential backoff
 */

/**
 * Default JSON fetcher for SWR.
 * Throws on non-OK responses so SWR can handle errors.
 */
export const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Fetch failed")
    error.status = res.status
    try {
      const data = await res.json()
      error.message = data.error || "Fetch failed"
    } catch {}
    throw error
  }
  return res.json()
}

/**
 * SWR cache key builders for consistent cache key naming.
 * Using functions ensures typo-free, refactor-safe cache keys.
 */
export const cacheKeys = {
  assignments: () => "/api/assignments",
  submissions: () => "/api/submissions",
  submissionsForAssignment: (id) => `/api/submissions?assignmentId=${id}`,
  analytics: () => "/api/analytics",
  workshops: () => "/api/workshops",
  workshopDetail: (id) => `/api/workshops/${id}`,
  workshopAnalytics: (id) => `/api/workshops/${id}/analytics`,
  ownerAnalytics: () => "/api/owner/analytics",
  gradebook: (workshopId) => `/api/student/workshops/${workshopId}/gradebook`,
  forumTopics: (workshopId) => `/api/forum/topics?workshopId=${workshopId}`,
}

/**
 * Default SWR configuration options.
 * Import and spread into useSWR calls or set globally in SWRConfig.
 */
export const swrDefaults = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5s dedup window — same key won't refetch within 5s
  errorRetryCount: 2,
}
