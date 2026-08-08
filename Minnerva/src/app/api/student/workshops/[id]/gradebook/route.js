import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"
import { formatScoreFromBasisPoints } from "@/services/submissionService"

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workshopId } = await params
    const userId = session.user.id
    const userGlobalRole = await getFreshUserGlobalRole(userId, session.user.role)

    // Verify user is enrolled in this workshop
    const authResult = await authorizeWorkshopAccess(
      userId,
      userGlobalRole,
      workshopId,
      ["STUDENT", "ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Access restricted for this workshop" }, { status: 403 })
    }

    const workshop = await db.workshop.findUnique({
      where: { id: workshopId },
      include: {
        assignments: {
          where: { published: true, deletedAt: null },
          orderBy: { dueDate: "asc" },
        },
        certificates: {
          where: { userId },
        },
      },
    })

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    const userSubmissions = await db.submission.findMany({
      where: {
        userId,
        assignmentId: { in: workshop.assignments.map((a) => a.id) },
        deletedAt: null,
      },
      orderBy: { version: "desc" },
    })

    // Map latest submission per assignment
    const submissionMap = new Map()
    userSubmissions.forEach((sub) => {
      if (!submissionMap.has(sub.assignmentId)) {
        submissionMap.set(sub.assignmentId, sub)
      }
    })

    let totalEarnedBasisPoints = 0
    let totalMaxMarks = 0
    let gradedCount = 0

    const gradebookRows = workshop.assignments.map((assignment) => {
      const sub = submissionMap.get(assignment.id)
      totalMaxMarks += assignment.maxMarks

      let isGraded = false
      let score = null

      if (sub && sub.isGradePublished && sub.totalScore !== null) {
        isGraded = true
        score = formatScoreFromBasisPoints(sub.totalScore)
        totalEarnedBasisPoints += sub.totalScore
        gradedCount++
      }

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks,
        submission: sub
          ? {
              id: sub.id,
              version: sub.version,
              status: sub.status,
              submittedAt: sub.submittedAt,
              isGradePublished: sub.isGradePublished,
              totalScore: isGraded ? formatScoreFromBasisPoints(sub.totalScore) : null,
              functionalityScore: isGraded ? formatScoreFromBasisPoints(sub.functionalityScore) : null,
              qualityScore: isGraded ? formatScoreFromBasisPoints(sub.qualityScore) : null,
              feedback: isGraded ? sub.feedback : null,
              repoUrl: sub.repoUrl,
              deploymentUrl: sub.deploymentUrl,
              driveUrl: sub.driveUrl,
            }
          : null,
      }
    })

    const totalEarnedMarks = Math.round(totalEarnedBasisPoints)
    const overallPercentage = totalMaxMarks > 0 ? Number(((totalEarnedMarks / totalMaxMarks) * 100).toFixed(2)) : 0
    const certificate = workshop.certificates[0] || null

    return NextResponse.json({
      workshop: {
        id: workshop.id,
        name: workshop.name,
        code: workshop.code,
        status: workshop.status,
      },
      student: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      summary: {
        totalEarnedMarks,
        totalMaxMarks,
        overallPercentage,
        taskCount: workshop.assignments.length,
        gradedCount,
        hasCertificate: Boolean(certificate),
      },
      certificate,
      gradebookRows,
    })
  } catch (error) {
    console.error("GET /api/student/workshops/[id]/gradebook error:", error)
    return NextResponse.json({ error: "Failed to fetch student gradebook" }, { status: 500 })
  }
}
