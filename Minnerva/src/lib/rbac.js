import { db } from "@/lib/db"

/**
 * Checks authorization for a user accessing a specific workshop.
 * 
 * Rules:
 * 1. Global User.role === "OWNER" is granted super-admin access to any workshop.
 * 2. Otherwise (for ADMIN or STUDENT roles), the UserRole table is queried for (userId, workshopId).
 * 3. Access is granted ONLY if a UserRole row exists AND its role matches one of allowedRoles.
 * 
 * @param {string} userId - Current authenticated user ID
 * @param {string} userGlobalRole - User.role from User table / session
 * @param {string} workshopId - Target workshop ID
 * @param {Array<'ADMIN'|'OWNER'|'STUDENT'>} allowedRoles - Allowed roles within workshop (default: ['ADMIN', 'OWNER'])
 * @returns {Promise<{ authorized: boolean, role: string | null }>}
 */
export async function authorizeWorkshopAccess(userId, userGlobalRole, workshopId, allowedRoles = ["ADMIN", "OWNER"]) {
  if (!userId || !workshopId) {
    return { authorized: false, role: null }
  }

  // 1. System Owner has global super-admin access
  if (userGlobalRole === "OWNER") {
    return { authorized: true, role: "OWNER" }
  }

  // 2. Query UserRole for (userId, workshopId)
  const userRole = await db.userRole.findUnique({
    where: {
      userId_workshopId: {
        userId,
        workshopId,
      },
    },
  })

  if (!userRole) {
    return { authorized: false, role: null }
  }

  // 3. Check if workshop role is in allowedRoles
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole.role)) {
    return { authorized: false, role: userRole.role }
  }

  return { authorized: true, role: userRole.role }
}

/**
 * Helper to fetch fresh user global role from DB alongside session
 */
export async function getFreshUserGlobalRole(userId, sessionRole) {
  if (!userId) return sessionRole || null
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return dbUser?.role || sessionRole || null
}
