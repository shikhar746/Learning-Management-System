import { db } from "@/lib/db"
import { getOrSetCache } from "@/lib/redis"

/**
 * Analytics Service complying strictly with RULE 4 & RULE 5:
 * - RULE 4: Admin stats aggregation — DO NOT SUM across workshops. For each workshop_id in admin.assigned_workshops,
 *   compute stats independently (registered_count, non_registered_count, admin_list). Render as separate per-workshop results.
 * - RULE 5: Owner is the only role with permission to view the sum/aggregate across ALL workshops.
 *   Admin and Student roles must never see this aggregate view.
 */
export const getAdminAnalytics = async (userId, userRole = "ADMIN") => {
  const cacheKey = userRole === "OWNER" ? "analytics:admin:owner" : `analytics:admin:${userId}`

  return getOrSetCache(cacheKey, 30, async () => {
    // RULE 5: Owner is the ONLY role with permission to view the sum/aggregate across ALL workshops.
    if (userRole === "OWNER") {
      const [
        totalStudents,
        totalAssignments,
        totalSubmissions,
        pendingSubmissionsCount,
        assignmentsWithSubmissions,
        upcomingDeadlines,
      ] = await Promise.all([
        db.user.count({ where: { role: "STUDENT" } }),
        db.assignment.count({ where: { deletedAt: null } }),
        db.submission.count({ where: { deletedAt: null } }),
        db.submission.count({
          where: { status: "SUBMITTED", deletedAt: null },
        }),
        db.assignment.findMany({
          where: { published: true, deletedAt: null },
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
            published: true,
            deletedAt: null,
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
        isAggregate: true, // Platform-wide aggregate view allowed for OWNER
        totalStudents,
        totalAssignments,
        totalSubmissions,
        pendingSubmissionsCount,
        submissionPercentage,
        classAverages,
        upcomingDeadlines,
      }
    }

    // RULE 4: Admin stats aggregation — DO NOT SUM across workshops.
    // For each workshop_id in admin.assigned_workshops: compute stats independently.
    // Render as separate per-workshop results. Never merge/total these numbers together.
    const totalPlatformStudents = await db.user.count({ where: { role: "STUDENT" } })

    const adminUserRoles = await db.userRole.findMany({
      where: { userId, role: { in: ["ADMIN", "OWNER"] } },
      select: { workshopId: true },
    })

    const assignedWorkshopIds = Array.from(
      new Set(adminUserRoles.map((r) => r.workshopId))
    )

    const assignedWorkshops = await db.workshop.findMany({
      where: {
        OR: [
          { createdById: userId },
          { id: { in: assignedWorkshopIds } },
        ],
      },
      include: {
        userRoles: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        assignments: {
          where: { deletedAt: null },
          include: {
            submissions: {
              where: { deletedAt: null },
              select: { id: true, status: true, totalScore: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const perWorkshopResults = assignedWorkshops.map((workshop) => {
      const studentRoles = workshop.userRoles.filter((r) => r.role === "STUDENT")
      const adminRoles = workshop.userRoles.filter((r) => r.role === "ADMIN" || r.role === "OWNER")

      const registered_count = studentRoles.length
      const non_registered_count = Math.max(0, totalPlatformStudents - registered_count)
      const admin_list = adminRoles.map((r) => r.user)

      const publishedAssignments = workshop.assignments.filter((a) => a.published)
      const assignmentCount = publishedAssignments.length

      let totalSubmissionsCount = 0
      let pendingSubmissionsCount = 0
      let gradedScores = []

      publishedAssignments.forEach((a) => {
        totalSubmissionsCount += a.submissions.length
        a.submissions.forEach((s) => {
          if (s.status === "SUBMITTED") pendingSubmissionsCount++
          if (s.status === "GRADED" && s.totalScore !== null) gradedScores.push(s.totalScore)
        })
      })

      const averageScore =
        gradedScores.length > 0
          ? Number((gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length).toFixed(1))
          : 0

      const upcomingDeadlines = publishedAssignments
        .filter((a) => a.dueDate && new Date(a.dueDate) >= new Date())
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          title: a.title,
          maxMarks: a.maxMarks,
          dueDate: a.dueDate,
        }))

      return {
        workshop_id: workshop.id,
        workshop_name: workshop.name,
        workshop_code: workshop.code,
        registered_count,
        non_registered_count,
        admin_list,
        assignmentCount,
        totalSubmissionsCount,
        pendingSubmissionsCount,
        averageScore,
        upcomingDeadlines,
      }
    })

    return {
      isAggregate: false, // Strict RULE 4 & RULE 5: No platform totals for ADMIN
      perWorkshopResults,
    }
  })
}

export const getStudentAnalytics = async (studentId) => {
  return getOrSetCache(`analytics:student:${studentId}`, 30, async () => {
    // RULE 2: Student only sees assignments/metrics in workshops they are registered in
    const studentRoles = await db.userRole.findMany({
      where: { userId: studentId, role: "STUDENT" },
      select: { workshopId: true },
    })

    const registeredWorkshopIds = studentRoles.map((r) => r.workshopId)

    const [
      totalPublishedAssignments,
      completedSubmissions,
      upcomingDeadlines,
    ] = await Promise.all([
      db.assignment.count({
        where: {
          published: true,
          deletedAt: null,
          workshopId: { in: registeredWorkshopIds },
        },
      }),
      db.submission.findMany({
        where: {
          userId: studentId,
          deletedAt: null,
          assignment: { workshopId: { in: registeredWorkshopIds } },
        },
        include: {
          assignment: { select: { id: true, title: true, maxMarks: true } },
        },
      }),
      db.assignment.findMany({
        where: {
          published: true,
          deletedAt: null,
          workshopId: { in: registeredWorkshopIds },
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
      isAggregate: false, // RULE 5: Student never sees aggregate view
      totalAssignments: totalPublishedAssignments,
      submittedCount,
      pendingCount,
      courseProgress,
      gradedSubmissions,
      upcomingDeadlines,
    }
  })
}
