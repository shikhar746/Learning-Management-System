"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck, Users, Crown, Key, BookOpen, Search, Loader2, AlertCircle, ArrowRight } from "lucide-react"

export default function OwnerControlPanelPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    fetch("/api/owner/analytics")
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.error) setData(resData)
      })
      .catch((err) => console.error("Failed to load Owner analytics:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
        <span>Loading Super-Admin Control Panel...</span>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Access Restricted</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          You must be logged in with Super-Admin / OWNER role to access this control panel.
        </p>
        <Link href="/admin">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
      </div>
    )
  }

  const { stats, workshops } = data

  const filteredWorkshops = workshops.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      (w.createdBy?.email || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || w.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Super-Admin Control Panel</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              System-wide metrics and tenant management across all workshop cohorts.
            </p>
          </div>
        </div>

        <Link href="/admin/workshops/new">
          <Button className="bg-purple-700 hover:bg-purple-800 text-white">
            + New Workshop Cohort
          </Button>
        </Link>
      </div>

      {/* Top Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Workshops</span>
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{stats.totalWorkshops}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="text-green-600 dark:text-green-400 font-semibold">{stats.activeWorkshops} Active</span> ·{" "}
            <span>{stats.completedWorkshops} Completed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Users</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{stats.studentCount} Students</span> ·{" "}
            <span>{stats.adminCount} Instructors</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submissions</span>
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{stats.totalSubmissions}</p>
          <div className="text-[11px] text-gray-400">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats.gradedSubmissions} Graded</span> ({Math.round((stats.gradedSubmissions / (stats.totalSubmissions || 1)) * 100)}%)
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Cohorts</span>
            <Key className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{stats.activeWorkshops}</p>
          <div className="text-[11px] text-gray-400">
            Accepting enrollees & submissions
          </div>
        </div>
      </div>

      {/* Workshop Search & Status Filter */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <Input
              placeholder="Search by title, code, or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-semibold">Filter Status:</span>
            {["ALL", "ACTIVE", "COMPLETED", "ARCHIVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? "bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-300 dark:border-purple-800"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Master Workshop Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[10px]">
                <th className="p-3">Workshop Title</th>
                <th className="p-3">Invite Code</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Students</th>
                <th className="p-3">Instructors</th>
                <th className="p-3">Tasks</th>
                <th className="p-3">Certs</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredWorkshops.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No workshops match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkshops.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{w.name}</td>
                    <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">{w.code}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{w.createdBy?.email || "System"}</td>
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{w.studentCount}</td>
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{w.adminCount}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{w.assignmentCount}</td>
                    <td className="p-3 text-amber-700 dark:text-amber-400 font-semibold">{w.certificateCount}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          w.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                            : w.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/workshops/${w.id}`}>
                        <Button variant="outline" size="sm" className="text-[11px] h-7 px-2">
                          Control Room <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
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
