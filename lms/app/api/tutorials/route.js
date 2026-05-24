import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/auth"

export async function POST(req) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, content, difficulty, videoUrl } = body

    if (!title || !description || !content) {
      return NextResponse.json(
        { error: "Title, description and content are required" },
        { status: 400 }
      )
    }

    const tutorial = await db.tutorial.create({
      data: {
        title,
        description,
        content,
        difficulty: difficulty || "beginner",
        videoUrl: videoUrl || null,
        published: true,
      },
    })

    return NextResponse.json(tutorial, { status: 201 })
  } catch (error) {
    console.error("Create tutorial error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const tutorials = await db.tutorial.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(tutorials)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}