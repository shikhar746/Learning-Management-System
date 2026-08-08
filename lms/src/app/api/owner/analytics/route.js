import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Super-Admin / Owner access required" }, { status: 403 })
    }

    const [
      totalWorkshops,
      activeWorkshops,
      completedWorkshops,
      archivedWorkshops,
      totalUsers,
      studentCount,
      adminCount,
      totalSubmissions,
      gradedSubmissions,
      workshops,
    ] = await Promise.all([
      db.workshop.count(),
      db.workshop.count({ where: { status: "ACTIVE" } }),
      db.workshop.count({ where: { status: "COMPLETED" } }),
      db.workshop.count({ where: { status: "ARCHIVED" } }),
      db.user.count(),
      db.user.count({ where: { role: "STUDENT" } }),
      db.user.count({ where: { role: "ADMIN" } }),
      db.submission.count({ where: { deletedAt: null } }),
      db.submission.count({ where: { status: "GRADED", deletedAt: null } }),
      db.workshop.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              assignments: true,
              userRoles: true,
              certificates: true,
            },
          },
          userRoles: {
            select: { role: true },
          },
        },
      }),
    ])

    const workshopTable = workshops.map((w) => {
      const admins = w.userRoles.filter((r) => r.role === "ADMIN" || r.role === "OWNER").length
      const students = w.userRoles.filter((r) => r.role === "STUDENT").length
      return {
        id: w.id,
        name: w.name,
        code: w.code,
        status: w.status,
        validUntil: w.validUntil,
        createdAt: w.createdAt,
        createdBy: w.createdBy,
        adminCount: admins,
        studentCount: students,
        assignmentCount: w._count.assignments,
        certificateCount: w._count.certificates,
      }
    })

    return NextResponse.json({
      stats: {
        totalWorkshops,
        activeWorkshops,
        completedWorkshops,
        archivedWorkshops,
        totalUsers,
        studentCount,
        adminCount,
        totalSubmissions,
        gradedSubmissions,
      },
      workshops: workshopTable,
    })
  } catch (error) {
    console.error("GET /api/owner/analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch Super-Admin analytics" }, { status: 500 })
  }
}
