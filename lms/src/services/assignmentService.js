import { db } from "@/lib/db"

export const getAssignments = async (isAdminOrOwner = false, workshopId = null) => {
  const whereClause = { deletedAt: null }

  if (!isAdminOrOwner) {
    whereClause.published = true
  }

  if (workshopId) {
    whereClause.workshopId = workshopId
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
