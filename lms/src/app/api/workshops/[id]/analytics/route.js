import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workshopId } = await params

    const workshop = await db.workshop.findUnique({
      where: { id: workshopId },
      include: {
        assignments: {
          where: { published: true, deletedAt: null },
        },
        userRoles: {
          where: { role: "STUDENT" },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    })

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    const students = workshop.userRoles.map((ur) => ur.user)
    const studentIds = students.map((s) => s.id)
    const assignmentIds = workshop.assignments.map((a) => a.id)

    const submissions = await db.submission.findMany({
      where: {
        userId: { in: studentIds },
        assignmentId: { in: assignmentIds },
        deletedAt: null,
      },
    })

    // Calculate Leaderboard & Student Stats
    const studentScores = new Map()
    students.forEach((s) => {
      studentScores.set(s.id, {
        id: s.id,
        name: s.name || s.email,
        email: s.email,
        image: s.image,
        totalPoints: 0,
        completedTasks: 0,
        submissionsCount: 0,
      })
    })

    // Filter latest published grade per student per assignment
    submissions.forEach((sub) => {
      const entry = studentScores.get(sub.userId)
      if (entry) {
        entry.submissionsCount++
        if (sub.isGradePublished && sub.totalScore !== null) {
          entry.totalPoints += sub.totalScore
          entry.completedTasks++
        }
      }
    })

    const leaderboard = Array.from(studentScores.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints
    )

    // Per-assignment class average
    const assignmentStats = workshop.assignments.map((assign) => {
      const assignSubs = submissions.filter(
        (s) => s.assignmentId === assign.id && s.isGradePublished && s.totalScore !== null
      )
      const totalScore = assignSubs.reduce((acc, curr) => acc + (curr.totalScore || 0), 0)
      const avgScore = assignSubs.length > 0 ? Math.round((totalScore / assignSubs.length) * 10) / 10 : 0
      return {
        id: assign.id,
        title: assign.title,
        maxMarks: assign.maxMarks,
        gradedCount: assignSubs.length,
        averageScore: avgScore,
      }
    })

    const totalMaxPossibleMarks = workshop.assignments.reduce((sum, a) => sum + a.maxMarks, 0)
    const inactiveStudents = leaderboard.filter((s) => s.submissionsCount === 0)

    return NextResponse.json({
      workshop: {
        id: workshop.id,
        name: workshop.name,
        code: workshop.code,
        studentCount: students.length,
        taskCount: workshop.assignments.length,
        totalMaxPossibleMarks,
      },
      leaderboard,
      assignmentStats,
      inactiveCount: inactiveStudents.length,
    })
  } catch (error) {
    console.error("GET /api/workshops/[id]/analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch workshop analytics" }, { status: 500 })
  }
}
