import { db } from "@/lib/db"
import { invalidateCachePattern } from "@/lib/redis"

function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createWorkshop({ name, description, code, validUntil, createdById, aiProvider, aiApiKey }) {
  let inviteCode = code && code.trim().length > 0 ? code.trim().toUpperCase() : generateInviteCode()

  // Ensure unique invite code
  let isDuplicate = await db.workshop.findUnique({ where: { code: inviteCode } })
  while (isDuplicate) {
    inviteCode = generateInviteCode()
    isDuplicate = await db.workshop.findUnique({ where: { code: inviteCode } })
  }

  // Safely parse validUntil date
  let parsedValidUntil = null
  if (validUntil && typeof validUntil === "string" && validUntil.trim().length > 0) {
    const d = new Date(validUntil)
    if (!isNaN(d.getTime())) {
      parsedValidUntil = d
    }
  }

  const workshop = await db.workshop.create({
    data: {
      name,
      description: description || null,
      code: inviteCode,
      validUntil: parsedValidUntil,
      aiProvider: aiProvider || "DEFAULT",
      aiApiKey: aiApiKey || null,
      createdById,
      userRoles: {
        create: {
          userId: createdById,
          role: "ADMIN",
        },
      },
    },
    include: {
      userRoles: true,
    },
  })

  // Purge analytics cache so new workshop displays immediately
  await invalidateCachePattern("analytics:")

  return workshop
}

export async function getWorkshopsForUser(userId, userRole) {
  if (userRole === "OWNER") {
    // Owner can view all workshops across the system with counts
    const workshops = await db.workshop.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            userRoles: true,
            assignments: true,
          },
        },
        userRoles: {
          select: {
            role: true,
          },
        },
      },
    })

    return workshops.map((w) => {
      const adminCount = w.userRoles?.filter((r) => r.role === "ADMIN" || r.role === "OWNER").length || 0
      const studentCount = w.userRoles?.filter((r) => r.role === "STUDENT").length || 0
      return {
        ...w,
        adminCount,
        studentCount,
        assignmentCount: w._count?.assignments || 0,
      }
    })
  }

  // Regular Admin / Student: fetch workshops created by them OR assigned in userRoles
  const workshops = await db.workshop.findMany({
    where: {
      OR: [
        { createdById: userId },
        { userRoles: { some: { userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          userRoles: true,
          assignments: true,
        },
      },
      userRoles: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  return workshops.map((w) => {
    const adminRoles = w.userRoles?.filter((r) => r.role === "ADMIN" || r.role === "OWNER") || []
    const studentRoles = w.userRoles?.filter((r) => r.role === "STUDENT") || []
    const currentUserRole = w.userRoles?.find((r) => r.userId === userId)?.role || (w.createdById === userId ? "ADMIN" : "STUDENT")

    return {
      ...w,
      roleInWorkshop: currentUserRole,
      adminCount: adminRoles.length,
      studentCount: studentRoles.length,
      assignmentCount: w._count?.assignments || 0,
    }
  })
}

export async function getWorkshopById(workshopId, userId) {
  const workshop = await db.workshop.findUnique({
    where: { id: workshopId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      userRoles: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      assignments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { assignments: true, forumTopics: true },
      },
    },
  })

  if (!workshop) return null

  const adminRoles = workshop.userRoles?.filter((r) => r.role === "ADMIN" || r.role === "OWNER") || []
  const studentRoles = workshop.userRoles?.filter((r) => r.role === "STUDENT") || []
  const currentUserRole = workshop.userRoles?.find((r) => r.userId === userId)?.role || (workshop.createdById === userId ? "ADMIN" : null)

  return {
    ...workshop,
    admins: adminRoles.map((r) => r.user),
    students: studentRoles.map((r) => r.user),
    currentUserRole,
    adminCount: adminRoles.length,
    studentCount: studentRoles.length,
  }
}

export async function joinWorkshopByCode(code, userId) {
  const cleanCode = code.trim().toUpperCase()
  const workshop = await db.workshop.findUnique({
    where: { code: cleanCode },
  })

  if (!workshop) {
    throw new Error("Invalid workshop invite code")
  }

  if (workshop.status !== "ACTIVE") {
    throw new Error("This workshop is no longer active")
  }

  if (workshop.validUntil && new Date() > new Date(workshop.validUntil)) {
    throw new Error("This workshop has expired")
  }

  // Check if user is already enrolled
  const existingRole = await db.userRole.findUnique({
    where: {
      userId_workshopId: {
        userId,
        workshopId: workshop.id,
      },
    },
  })

  if (existingRole) {
    return { workshop, alreadyJoined: true, role: existingRole.role }
  }

  const userRole = await db.userRole.create({
    data: {
      userId,
      workshopId: workshop.id,
      role: "STUDENT",
    },
  })

  // Purge analytics cache on new enrollment
  await invalidateCachePattern("analytics:")

  return { workshop, alreadyJoined: false, role: userRole.role }
}

export async function inviteAdminToWorkshop(workshopId, email, inviterUserId) {
  const workshop = await db.workshop.findUnique({
    where: { id: workshopId },
  })

  if (!workshop) {
    throw new Error("Workshop not found")
  }

  const targetUser = await db.user.findUnique({
    where: { email },
  })

  if (!targetUser) {
    throw new Error("User with this email is not registered yet")
  }

  const existingRole = await db.userRole.findUnique({
    where: {
      userId_workshopId: {
        userId: targetUser.id,
        workshopId,
      },
    },
  })

  if (existingRole) {
    if (existingRole.role === "ADMIN" || existingRole.role === "OWNER") {
      throw new Error("User is already an Admin in this workshop")
    }

    // Upgrade from STUDENT to ADMIN
    const updatedRole = await db.userRole.update({
      where: { id: existingRole.id },
      data: { role: "ADMIN" },
    })
    return { user: targetUser, role: updatedRole.role, upgraded: true }
  }

  const newRole = await db.userRole.create({
    data: {
      userId: targetUser.id,
      workshopId,
      role: "ADMIN",
    },
  })

  return { user: targetUser, role: newRole.role, upgraded: false }
}

export async function updateWorkshop(workshopId, data) {
  const updatedData = { ...data }
  if (data.validUntil) {
    const d = new Date(data.validUntil)
    updatedData.validUntil = !isNaN(d.getTime()) ? d : null
  }

  const res = await db.workshop.update({
    where: { id: workshopId },
    data: updatedData,
  })

  await invalidateCachePattern("analytics:")
  return res
}

export async function deleteWorkshop(workshopId) {
  const res = await db.workshop.delete({
    where: { id: workshopId },
  })
  await invalidateCachePattern("analytics:")
  return res
}
