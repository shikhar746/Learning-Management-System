"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import ThemeToggle from "@/components/shared/ThemeToggle"

const studentLinks = [
  { href: "/student", label: "Dashboard Overview", icon: "📊" },
  { href: "/student/workshops", label: "My Workshops", icon: "🏫" },
  { href: "/student/assignments", label: "Assignments", icon: "📝" },

]

const adminLinks = [
  { href: "/admin", label: "Analytics Overview", icon: "📊" },
  { href: "/admin/owner", label: "Owner Control Panel", icon: "👑" },
  { href: "/admin/workshops", label: "Workshop Cohorts", icon: "🏫" },
  { href: "/admin/assignments", label: "Assignment Management", icon: "📝" },

  { href: "/admin/users", label: "Users", icon: "👥" },
]

export default function Sidebar({ role, user }) {
  const pathname = usePathname()
  const links = role === "admin" ? adminLinks : studentLinks

  return (
    <aside className="w-64 h-screen sticky top-0 shrink-0 overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors select-none">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Minerva</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role} portal</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/admin" && link.href !== "/student" && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3 shrink-0">
        <div className="px-1">
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center justify-center text-sm font-medium">
              {user?.name?.[0] ?? "U"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{user?.name ?? ""}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
