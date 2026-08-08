import { db } from "@/lib/db"
import { getOrSetCache } from "@/lib/redis"

export const getAdminAnalytics = async (userId, userRole = "ADMIN") => {
  const cacheKey = userRole === "OWNER" ? "analytics:admin:owner" : `analytics:admin:${userId}`

  return getOrSetCache(cacheKey, 30, async () => {
    let workshopFilter = {}

    // If regular ADMIN (not OWNER), scope data strictly to their own workshops
    if (userRole !== "OWNER" && userId) {
      const adminRoles = await db.userRole.findMany({
        where: { userId, role: { in: ["ADMIN", "OWNER"] } },
        select: { workshopId: true },
      })

      const adminWorkshopIds = adminRoles.map((r) => r.workshopId)

      workshopFilter = {
        OR: [
          { createdById: userId },
          { id: { in: adminWorkshopIds } },
          { workshopId: { in: adminWorkshopIds } },
        ],
      }
    }

    // Build scoped query conditions
    const assignmentWhere = {
      deletedAt: null,
      ...(userRole !== "OWNER" && userId
        ? {
            OR: [
              { createdById: userId },
              { workshopId: { in: (await db.userRole.findMany({ where: { userId, role: { in: ["ADMIN", "OWNER"] } }, select: { workshopId: true } })).map((r) => r.workshopId) } },
            ],
          }
        : {}),
    }

    const submissionWhere = {
      deletedAt: null,
      ...(userRole !== "OWNER" && userId
        ? {
            assignment: assignmentWhere,
          }
        : {}),
    }

    const studentWhere = userRole !== "OWNER" && userId
      ? {
          role: "STUDENT",
          workshopRoles: {
            some: {
              workshopId: {
                in: (await db.userRole.findMany({ where: { userId, role: { in: ["ADMIN", "OWNER"] } }, select: { workshopId: true } })).map((r) => r.workshopId),
              },
            },
          },
        }
      : { role: "STUDENT" }

    const [
      totalStudents,
      totalAssignments,
      totalSubmissions,
      pendingSubmissionsCount,
      assignmentsWithSubmissions,
      upcomingDeadlines,
    ] = await Promise.all([
      db.user.count({ where: studentWhere }),
      db.assignment.count({ where: assignmentWhere }),
      db.submission.count({ where: submissionWhere }),
      db.submission.count({
        where: { ...submissionWhere, status: "SUBMITTED" },
      }),
      db.assignment.findMany({
        where: { ...assignmentWhere, published: true },
        select: {
          id: true,
          title: true,
          maxMarks: true,
          dueDate: true,
          submissions: {
            where: { status: "GRADED", deletedAt: null },
            select: { totalScore: true },
          },
        },
      }),
      db.assignment.findMany({
        where: {
          ...assignmentWhere,
          published: true,
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ])

    const classAverages = assignmentsWithSubmissions.map((assign) => {
      const scores = assign.submissions.map((s) => s.totalScore)
      const avg =
        scores.length > 0
          ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
          : 0
      return {
        id: assign.id,
        title: assign.title,
        maxMarks: assign.maxMarks,
        averageScore: avg,
        gradedCount: scores.length,
      }
    })

    const submissionPercentage =
      totalStudents > 0 && totalAssignments > 0
        ? Number(
            ((totalSubmissions / (totalStudents * totalAssignments)) * 100).toFixed(1)
          )
        : 0

    return {
      totalStudents,
      totalAssignments,
      totalSubmissions,
      pendingSubmissionsCount,
      submissionPercentage,
      classAverages,
      upcomingDeadlines,
    }
  })
}

export const getStudentAnalytics = async (studentId) => {
  return getOrSetCache(`analytics:student:${studentId}`, 30, async () => {
    const [
      totalPublishedAssignments,
      completedSubmissions,
      upcomingDeadlines,
    ] = await Promise.all([
      db.assignment.count({ where: { published: true, deletedAt: null } }),
      db.submission.findMany({
        where: { userId: studentId, deletedAt: null },
        include: {
          assignment: { select: { id: true, title: true, maxMarks: true } },
        },
      }),
      db.assignment.findMany({
        where: {
          published: true,
          deletedAt: null,
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ])

    const submittedAssignmentIds = new Set(
      completedSubmissions.map((s) => s.assignmentId)
    )

    const submittedCount = submittedAssignmentIds.size
    const pendingCount = Math.max(0, totalPublishedAssignments - submittedCount)

    const courseProgress =
      totalPublishedAssignments > 0
        ? Number(((submittedCount / totalPublishedAssignments) * 100).toFixed(1))
        : 0

    const gradedSubmissions = completedSubmissions.filter(
      (s) => s.isGradePublished && s.totalScore !== null
    )

    return {
      totalAssignments: totalPublishedAssignments,
      submittedCount,
      pendingCount,
      courseProgress,
      gradedSubmissions,
      upcomingDeadlines,
    }
  })
}
