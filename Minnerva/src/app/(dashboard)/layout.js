import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Sidebar from "@/components/shared/Sidebar"

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  const effectiveRole = dbUser?.role || session?.user?.role || "STUDENT"

  const roleMap = {
    STUDENT: "student",
    ADMIN: "admin",
    OWNER: "owner",
  }

  const role = roleMap[effectiveRole] || "student"

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Sidebar role={role} user={{ ...session.user, role: effectiveRole }} />
      <main className="flex-1 p-8 overflow-y-auto min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        {children}
      </main>
    </div>
  )
}