import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createTopicSchema } from "@/lib/validations/forum"
import { createForumTopic, getTopicsForWorkshop } from "@/services/forumService"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workshopId = searchParams.get("workshopId")

    if (!workshopId) {
      return NextResponse.json({ error: "workshopId parameter is required" }, { status: 400 })
    }

    const topics = await getTopicsForWorkshop(workshopId)
    return NextResponse.json({ topics })
  } catch (error) {
    console.error("GET /api/forum/topics error:", error)
    return NextResponse.json({ error: "Failed to fetch forum topics" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createTopicSchema.parse(body)

    const topic = await createForumTopic({
      ...validatedData,
      createdById: session.user.id,
    })

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/forum/topics error:", error)
    return NextResponse.json({ error: error.message || "Failed to create forum topic" }, { status: 500 })
  }
}
