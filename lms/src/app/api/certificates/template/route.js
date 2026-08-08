import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { configureTemplateSchema } from "@/lib/validations/certificate"
import { configureCertificateTemplate, getCertificateTemplate } from "@/services/certificateService"

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

    const template = await getCertificateTemplate(workshopId)
    return NextResponse.json({ template })
  } catch (error) {
    console.error("GET /api/certificates/template error:", error)
    return NextResponse.json({ error: "Failed to fetch certificate template" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    if (role !== "ADMIN" && role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = configureTemplateSchema.parse(body)

    const template = await configureCertificateTemplate(validatedData)
    return NextResponse.json(template)
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/certificates/template error:", error)
    return NextResponse.json({ error: error.message || "Failed to configure template" }, { status: 500 })
  }
}
