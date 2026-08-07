import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdminOrOwner =
      session.user.role === "ADMIN" || session.user.role === "OWNER"

    if (isAdminOrOwner) {
      const [
        totalStudents,
        totalAssignments,
        totalSubmissions,
        pendingSubmissionsCount,
        gradedSubmissions,
        assignmentsWithSubmissions,
        upcomingDeadlines,
      ] = await Promise.all([
        db.user.count({ where: { role: "STUDENT" } }),
        db.assignment.count({ where: { deletedAt: null } }),
        db.submission.count({ where: { deletedAt: null } }),
        db.submission.count({
          where: { status: "SUBMITTED", deletedAt: null },
        }),
        db.submission.findMany({
          where: { status: "GRADED", totalScore: { not: null }, deletedAt: null },
          select: { assignmentId: true, totalScore: true },
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

      return NextResponse.json({
        totalStudents,
        totalAssignments,
        totalSubmissions,
        pendingSubmissionsCount,
        submissionPercentage,
        classAverages,
        upcomingDeadlines,
      })
    } else {
      // Student Analytics
      const studentId = session.user.id
      const [
        totalPublishedAssignments,
        completedSubmissions,
        totalTutorials,
        completedTutorialsCount,
        upcomingDeadlines,
      ] = await Promise.all([
        db.assignment.count({ where: { published: true, deletedAt: null } }),
        db.submission.findMany({
          where: { userId: studentId, deletedAt: null },
          include: {
            assignment: { select: { id: true, title: true, maxMarks: true } },
          },
        }),
        db.tutorial.count({ where: { published: true } }),
        db.progress.count({ where: { userId: studentId, completed: true } }),
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
        totalTutorials > 0
          ? Number(((completedTutorialsCount / totalTutorials) * 100).toFixed(1))
          : 0

      const gradedSubmissions = completedSubmissions.filter(
        (s) => s.isGradePublished && s.totalScore !== null
      )

      return NextResponse.json({
        totalAssignments: totalPublishedAssignments,
        submittedCount,
        pendingCount,
        courseProgress,
        gradedSubmissions,
        upcomingDeadlines,
      })
    }
  } catch (error) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
