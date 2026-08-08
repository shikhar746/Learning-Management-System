import { NextResponse } from "next/server"
import { getSubmissionById } from "@/services/submissionService"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Resolve submission first to get its parent assignment's workshopId
    const existingSubmission = await db.submission.findUnique({
      where: { id },
      include: {
        assignment: { select: { workshopId: true } },
      },
    })

    if (!existingSubmission || existingSubmission.deletedAt) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const workshopId = existingSubmission.assignment?.workshopId

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      workshopId,
      ["ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin access required for this workshop" }, { status: 403 })
    }

    const submission = await getSubmissionById(id)

    if (!submission || submission.deletedAt) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Fetch submission detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
