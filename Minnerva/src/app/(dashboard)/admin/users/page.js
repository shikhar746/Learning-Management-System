"use client"

import { useEffect, useState } from "react"
import { Users, Search, ShieldCheck, Crown, UserCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const roleBadges = {
  OWNER: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  STUDENT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [updatingId, setUpdatingId] = useState(null)
  const [message, setMessage] = useState("")

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/owner/analytics")
      const data = await res.json()
      if (data?.workshops) {
        // Fetch all users via owner analytics or dedicated API
        const userRes = await fetch("/api/admin/users")
        const userData = await userRes.json()
        setUsers(Array.isArray(userData) ? userData : [])
      }
    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (targetUserId, newRole) => {
    setUpdatingId(targetUserId)
    setMessage("")

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, newRole }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update role")

      setMessage(`Role updated to ${newRole} successfully!`)
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const ownerCount = users.filter((u) => u.role === "OWNER").length
  const adminCount = users.filter((u) => u.role === "ADMIN").length
  const studentCount = users.filter((u) => u.role === "STUDENT").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading User Directory...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            User Management Directory
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage user accounts, assign system roles, and view cohort enrollments.
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Aggregate User Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Registered</span>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{users.length}</p>
          <p className="text-[11px] text-gray-400">All accounts</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Students</span>
          <p className="text-3xl font-extrabold text-blue-600">{studentCount}</p>
          <p className="text-[11px] text-gray-400">Enrolled participants</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructors</span>
          <p className="text-3xl font-extrabold text-purple-600">{adminCount}</p>
          <p className="text-[11px] text-gray-400">Admins & Evaluators</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Super-Admins</span>
          <p className="text-3xl font-extrabold text-amber-600">{ownerCount}</p>
          <p className="text-[11px] text-gray-400">System Owners</p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-semibold">Filter Role:</span>
            {["ALL", "STUDENT", "ADMIN", "OWNER"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  roleFilter === r
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* User Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[10px]">
                <th className="p-3">User</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Current Role</th>
                <th className="p-3">Registered Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                            {user.name?.[0] || "U"}
                          </div>
                        )}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{user.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400 font-mono">{user.email}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleBadges[user.role] || roleBadges.STUDENT}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      {updatingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-auto" />
                      ) : user.role === "OWNER" ? (
                        <span className="text-[11px] text-gray-400 italic">System Owner</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {user.role === "STUDENT" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, "ADMIN")}
                              className="text-[11px] h-7 px-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            >
                              Promote to Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, "STUDENT")}
                              className="text-[11px] h-7 px-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              Demote to Student
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}