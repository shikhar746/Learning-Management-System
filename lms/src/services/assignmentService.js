import { db } from "@/lib/db"

export const getAssignments = async (user = null, workshopId = null) => {
  const whereClause = { deletedAt: null }
  const userRole = user?.role
  const userId = user?.id

  // RULE 2: Student -> Assignment visibility is strictly gated by workshop registration.
  // Student sees assignment IF student.registered_workshops CONTAINS assignment.workshopId.
  // Otherwise, assignment does not appear in that student's assignments list at all (fully absent).
  if (userRole === "STUDENT" && userId) {
    whereClause.published = true
    const studentRoles = await db.userRole.findMany({
      where: { userId, role: "STUDENT" },
      select: { workshopId: true },
    })
    const registeredWorkshopIds = studentRoles.map((r) => r.workshopId)

    if (workshopId) {
      if (!registeredWorkshopIds.includes(workshopId)) {
        return [] // Fully absent if student is not registered in this workshop
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
    // RULE 3 & RULE 4: Admin assigned workshops (many-to-many)
    if (workshopId) {
      whereClause.workshopId = workshopId
    } else {
      const adminRoles = await db.userRole.findMany({
        where: { userId, role: { in: ["ADMIN", "OWNER"] } },
        select: { workshopId: true },
      })
      const adminWorkshopIds = adminRoles.map((r) => r.workshopId)

      whereClause.OR = [
        { createdById: userId },
        { workshopId: { in: adminWorkshopIds } },
      ]
    }
  } else if (userRole === "OWNER") {
    // RULE 5: Owner can view all assignments across all workshops
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

  // Enforce RULE 2: If student is not registered in this assignment's workshop, return null
  if (userId && !isAdminOrOwner && assignment.workshopId) {
    const isRegistered = await db.userRole.findFirst({
      where: {
        userId,
        workshopId: assignment.workshopId,
        role: "STUDENT",
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
  return db.assignment.create({
    data: {
      ...rest,
      workshopId: workshopId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
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
    updateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null
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
