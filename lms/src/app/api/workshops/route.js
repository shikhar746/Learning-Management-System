import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createWorkshopSchema } from "@/lib/validations/workshop"
import { createWorkshop, getWorkshopsForUser } from "@/services/workshopService"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workshops = await getWorkshopsForUser(session.user.id, session.user.role)
    return NextResponse.json({ workshops })
  } catch (error) {
    console.error("GET /api/workshops error:", error)
    return NextResponse.json({ error: "Failed to fetch workshops" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createWorkshopSchema.parse(body)

    const workshop = await createWorkshop({
      ...validatedData,
      createdById: session.user.id,
    })

    return NextResponse.json(workshop, { status: 201 })
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/workshops error:", error)
    return NextResponse.json({ error: error.message || "Failed to create workshop" }, { status: 500 })
  }
}
