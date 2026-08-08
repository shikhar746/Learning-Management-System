import { NextResponse } from "next/server"
import { createSubmissionSchema } from "@/lib/validations/submission"
import { getSubmissions, createOrVersionSubmission } from "@/services/submissionService"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get("assignmentId")

    const isAdminOrOwner =
      session.user.role === "ADMIN" || session.user.role === "OWNER"

    const submissions = await getSubmissions({
      assignmentId,
      userId: session.user.id,
      isAdminOrOwner,
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Fetch submissions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const result = createSubmissionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { repoUrl, deploymentUrl, fileUrls } = result.data

    if (!repoUrl && !deploymentUrl && (!fileUrls || fileUrls.length === 0)) {
      return NextResponse.json(
        { error: "Provide at least a repository URL, deployment URL, or uploaded file" },
        { status: 400 }
      )
    }

    const submission = await createOrVersionSubmission(session.user.id, result.data)
    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error("Create submission error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 400 }
    )
  }
}
