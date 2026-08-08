import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { enqueueBatchAiGrading, getBatchJobStatus } from "@/services/batchGradingQueue"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get("batchId")

    if (!batchId) {
      return NextResponse.json({ error: "batchId parameter is required" }, { status: 400 })
    }

    const job = getBatchJobStatus(batchId)
    if (!job) {
      return NextResponse.json({ error: "Batch job not found" }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error("GET /api/admin/submissions/batch status error:", error)
    return NextResponse.json({ error: "Failed to fetch batch status" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { assignmentId, action } = body

    if (!assignmentId || !action) {
      return NextResponse.json({ error: "assignmentId and action are required" }, { status: 400 })
    }

    // 1. Resolve assignment first to get its workshopId
    const existingAssignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, workshopId: true },
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      existingAssignment.workshopId,
      ["ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin access required for this workshop" }, { status: 403 })
    }

    if (action === "AI_DRAFT_ALL") {
      const submissions = await db.submission.findMany({
        where: { assignmentId, deletedAt: null },
      })

      if (submissions.length === 0) {
        return NextResponse.json({ message: "No submissions found to grade", count: 0 })
      }

      // Enqueue job and return 202 Accepted immediately
      const job = enqueueBatchAiGrading(assignmentId, submissions)
      return NextResponse.json(job, { status: 202 })
    }

    if (action === "PUBLISH_ALL") {
      const updated = await db.submission.updateMany({
        where: {
          assignmentId,
          deletedAt: null,
          status: "GRADED",
        },
        data: {
          isGradePublished: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Successfully published grades for ${updated.count} evaluated submissions!`,
        count: updated.count,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/admin/submissions/batch error:", error)
    return NextResponse.json({ error: error.message || "Failed to process batch action" }, { status: 500 })
  }
}
