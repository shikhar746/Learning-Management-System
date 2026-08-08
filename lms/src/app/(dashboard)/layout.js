import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/shared/Sidebar"

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const roleMap = {
    STUDENT: "student",
    ADMIN: "admin",
  }

  const role = roleMap[session?.user?.role] || "owner"

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Sidebar role={role} user={session.user} />
      <main className="flex-1 p-8 overflow-y-auto min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        {children}
      </main>
    </div>
  )
}