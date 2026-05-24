import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/dashboard/Sidebar"

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const role =
    session.user.role === "ADMIN" || session.user.role === "OWNER"
      ? "admin"
      : "student"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} user={session.user} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}