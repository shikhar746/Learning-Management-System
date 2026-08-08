import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createSubmissionSchema } from "@/lib/validations/submission"
import { createSubmission, getSubmissionsForAssignment, formatSubmissionScores } from "@/services/submissionService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get("assignmentId")
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)

    // If assignmentId is provided, check UserRole before returning submissions
    if (assignmentId) {
      const assignment = await db.assignment.findUnique({
        where: { id: assignmentId },
        select: { id: true, workshopId: true },
      })

      if (!assignment) {
        return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
      }

      if (assignment.workshopId) {
        const authResult = await authorizeWorkshopAccess(
          session.user.id,
          userGlobalRole,
          assignment.workshopId,
          ["STUDENT", "ADMIN", "OWNER"]
        )

        if (!authResult.authorized) {
          return NextResponse.json({ error: "Forbidden: Access restricted for this workshop" }, { status: 403 })
        }

        const isAdminOrOwner = authResult.role === "ADMIN" || authResult.role === "OWNER"
        if (isAdminOrOwner) {
          const submissions = await getSubmissionsForAssignment(assignmentId)
          return NextResponse.json(submissions)
        }
      }

      // Student only sees their own submissions for this assignment
      const studentSubmissions = await db.submission.findMany({
        where: {
          assignmentId,
          userId: session.user.id,
          deletedAt: null,
        },
        orderBy: { version: "desc" },
      })
      return NextResponse.json(studentSubmissions.map(formatSubmissionScores))
    }

    // Return all submissions for the current student (used by /student/assignments page)
    const submissions = await db.submission.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      orderBy: { version: "desc" },
    })

    return NextResponse.json(submissions.map(formatSubmissionScores))
  } catch (error) {
    console.error("GET /api/submissions error:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createSubmissionSchema.parse(body)

    // 1. Resolve assignment first to get its workshopId
    const assignment = await db.assignment.findUnique({
      where: { id: validatedData.assignmentId },
      select: { id: true, workshopId: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    if (assignment.workshopId) {
      const authResult = await authorizeWorkshopAccess(
        session.user.id,
        userGlobalRole,
        assignment.workshopId,
        ["STUDENT", "ADMIN", "OWNER"]
      )

      if (!authResult.authorized) {
        return NextResponse.json({ error: "Forbidden: You are not enrolled in this workshop" }, { status: 403 })
      }
    }

    const submission = await createSubmission(validatedData, session.user.id)
    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/submissions error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit assignment" }, { status: 400 })
  }
}
