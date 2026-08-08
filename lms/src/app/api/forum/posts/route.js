import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createPostSchema } from "@/lib/validations/forum"
import { createForumPost } from "@/services/forumService"

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createPostSchema.parse(body)

    const post = await createForumPost({
      ...validatedData,
      userId: session.user.id,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/forum/posts error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit post" }, { status: 500 })
  }
}
