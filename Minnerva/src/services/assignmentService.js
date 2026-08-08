import { db } from "@/lib/db"

export const getAssignments = async (user = null, workshopId = null) => {
  const whereClause = { deletedAt: null }
  const userRole = user?.role
  const userId = user?.id

  // 1. Student -> Assignment visibility is strictly gated by workshop registration
  if (userRole === "STUDENT" && userId) {
    whereClause.published = true
    const studentRoles = await db.userRole.findMany({
      where: { userId, role: "STUDENT" },
      select: { workshopId: true },
    })
    const registeredWorkshopIds = studentRoles.map((r) => r.workshopId)

    if (workshopId) {
      if (!registeredWorkshopIds.includes(workshopId)) {
        return [] // Absent if student is not registered in this workshop
      }
      whereClause.workshopId = workshopId
    } else {
      whereClause.workshopId = { in: registeredWorkshopIds }
    }
  } else if (!userRole) {
    // Unauthenticated guest: only published assignments
    whereClause.published = true
    if (workshopId) whereClause.workshopId = workshopId
  } else if (userRole === "ADMIN" && userId) {
    // 2. Admin assigned workshops (strictly via UserRole table)
    const adminRoles = await db.userRole.findMany({
      where: { userId, role: { in: ["ADMIN", "OWNER"] } },
      select: { workshopId: true },
    })
    const adminWorkshopIds = adminRoles.map((r) => r.workshopId)

    if (workshopId) {
      if (!adminWorkshopIds.includes(workshopId)) {
        return [] // Admin not assigned to this workshop
      }
      whereClause.workshopId = workshopId
    } else {
      whereClause.workshopId = { in: adminWorkshopIds }
    }
  } else if (userRole === "OWNER") {
    // 3. Platform Owner can view all assignments across all workshops
    if (workshopId) {
      whereClause.workshopId = workshopId
    }
  }

  return db.assignment.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      workshop: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export const getAssignmentById = async (id, userId, isAdminOrOwner = false) => {
  const assignment = await db.assignment.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      workshop: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { submissions: true },
      },
    },
  })

  if (!assignment || assignment.deletedAt) return null
  if (!assignment.published && !isAdminOrOwner) return null

  // Gated by UserRole if non-admin user
  if (userId && !isAdminOrOwner && assignment.workshopId) {
    const isRegistered = await db.userRole.findFirst({
      where: {
        userId,
        workshopId: assignment.workshopId,
      },
    })
    if (!isRegistered) return null
  }

  let userSubmissions = []
  if (userId && !isAdminOrOwner) {
    userSubmissions = await db.submission.findMany({
      where: {
        assignmentId: id,
        userId,
        deletedAt: null,
      },
      orderBy: { version: "desc" },
    })
  }

  return {
    ...assignment,
    userSubmissions,
  }
}

export const createAssignment = async (data, createdById) => {
  const { workshopId, ...rest } = data
  let parsedDueDate = null
  if (data.dueDate && typeof data.dueDate === "string" && data.dueDate.trim().length > 0) {
    const d = new Date(data.dueDate)
    if (!isNaN(d.getTime())) {
      parsedDueDate = d
    }
  }

  return db.assignment.create({
    data: {
      ...rest,
      workshopId: workshopId || null,
      dueDate: parsedDueDate,
      createdById,
    },
    include: {
      workshop: { select: { id: true, name: true } },
    },
  })
}

export const updateAssignment = async (id, data) => {
  const updateData = { ...data }
  if (updateData.dueDate !== undefined) {
    let parsedDueDate = null
    if (updateData.dueDate && typeof updateData.dueDate === "string" && updateData.dueDate.trim().length > 0) {
      const d = new Date(updateData.dueDate)
      if (!isNaN(d.getTime())) {
        parsedDueDate = d
      }
    }
    updateData.dueDate = parsedDueDate
  }

  return db.assignment.update({
    where: { id },
    data: updateData,
    include: {
      workshop: { select: { id: true, name: true } },
    },
  })
}

export const deleteAssignment = async (id) => {
  return db.assignment.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
