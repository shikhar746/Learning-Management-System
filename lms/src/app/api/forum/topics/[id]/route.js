import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTopicWithPosts } from "@/services/forumService"

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const topic = await getTopicWithPosts(id)
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    return NextResponse.json(topic)
  } catch (error) {
    console.error("GET /api/forum/topics/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch topic thread" }, { status: 500 })
  }
}
