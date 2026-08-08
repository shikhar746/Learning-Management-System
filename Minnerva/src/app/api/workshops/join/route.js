import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { joinWorkshopSchema } from "@/lib/validations/workshop"
import { joinWorkshopByCode } from "@/services/workshopService"

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { code } = joinWorkshopSchema.parse(body)

    const result = await joinWorkshopByCode(code, session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/workshops/join error:", error)
    return NextResponse.json({ error: error.message || "Failed to join workshop" }, { status: 400 })
  }
}
