import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const submissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  repoUrl: z.string().url("Invalid Repository URL").optional().or(z.literal("")),
  deploymentUrl: z.string().url("Invalid Deployment URL").optional().or(z.literal("")),
  branch: z.string().optional().default("main"),
  fileUrls: z.array(z.string()).optional().default([]),
  comments: z.string().optional(),
})

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

    let whereClause = { deletedAt: null }

    if (assignmentId) {
      whereClause.assignmentId = assignmentId
    }

    if (!isAdminOrOwner) {
      whereClause.userId = session.user.id
    }

    const submissions = await db.submission.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignment: {
          select: { id: true, title: true, maxMarks: true, dueDate: true },
        },
      },
      orderBy: { submittedAt: "desc" },
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
    const result = submissionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { assignmentId, repoUrl, deploymentUrl, branch, fileUrls, comments } =
      result.data

    if (!repoUrl && !deploymentUrl && (!fileUrls || fileUrls.length === 0)) {
      return NextResponse.json(
        { error: "Provide at least a repository URL, deployment URL, or uploaded file" },
        { status: 400 }
      )
    }

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment || assignment.deletedAt) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const previousSubmissions = await db.submission.findMany({
      where: {
        assignmentId,
        userId: session.user.id,
        deletedAt: null,
      },
      orderBy: { version: "desc" },
    })

    if (previousSubmissions.length > 0 && !assignment.allowResubmission) {
      return NextResponse.json(
        { error: "Resubmissions are disabled for this assignment" },
        { status: 400 }
      )
    }

    const nextVersion = previousSubmissions.length > 0
      ? previousSubmissions[0].version + 1
      : 1

    const newSubmission = await db.submission.create({
      data: {
        userId: session.user.id,
        assignmentId,
        version: nextVersion,
        repoUrl: repoUrl || null,
        deploymentUrl: deploymentUrl || null,
        branch: branch || "main",
        fileUrls: fileUrls || [],
        comments: comments || null,
        status: previousSubmissions.length > 0 ? "RESUBMITTED" : "SUBMITTED",
      },
    })

    return NextResponse.json(newSubmission, { status: 201 })
  } catch (error) {
    console.error("Create submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
