import { db } from "@/lib/db"

function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createWorkshop({ name, description, code, validUntil, createdById }) {
  let inviteCode = code ? code.trim().toUpperCase() : generateInviteCode()

  // Ensure unique invite code
  let isDuplicate = await db.workshop.findUnique({ where: { code: inviteCode } })
  while (isDuplicate) {
    inviteCode = generateInviteCode()
    isDuplicate = await db.workshop.findUnique({ where: { code: inviteCode } })
  }

  const workshop = await db.workshop.create({
    data: {
      name,
      description,
      code: inviteCode,
      validUntil: validUntil ? new Date(validUntil) : null,
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
      const adminCount = w.userRoles.filter((r) => r.role === "ADMIN" || r.role === "OWNER").length
      const studentCount = w.userRoles.filter((r) => r.role === "STUDENT").length
      return {
        ...w,
        adminCount,
        studentCount,
        assignmentCount: w._count.assignments,
      }
    })
  }

  // Regular user (Admin or Student): fetch workshops they are explicitly enrolled in
  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: {
      workshop: {
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  return userRoles.map((ur) => ({
    ...ur.workshop,
    roleInWorkshop: ur.role,
    assignmentCount: ur.workshop._count.assignments,
  }))
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

  const adminRoles = workshop.userRoles.filter((r) => r.role === "ADMIN" || r.role === "OWNER")
  const studentRoles = workshop.userRoles.filter((r) => r.role === "STUDENT")
  const currentUserRole = workshop.userRoles.find((r) => r.userId === userId)?.role

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
    updatedData.validUntil = new Date(data.validUntil)
  }

  return await db.workshop.update({
    where: { id: workshopId },
    data: updatedData,
  })
}

export async function deleteWorkshop(workshopId) {
  return await db.workshop.delete({
    where: { id: workshopId },
  })
}
