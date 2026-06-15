"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const studentLinks = [
  { href: "/student/tutorials", label: "Tutorials", icon: "📚" },
  { href: "/student/assignments", label: "Assignments", icon: "📝" },
]

const adminLinks = [
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/tutorials", label: "Tutorials", icon: "📚" },
]

export default function Sidebar({ role, user }) {
  const pathname = usePathname()
  const links = role === "admin" ? adminLinks : studentLinks

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold">LMS Platform</h2>
        <span className="text-xs text-gray-500 capitalize">{role} portal</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
              {user?.name?.[0] ?? "U"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name ?? ""}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}