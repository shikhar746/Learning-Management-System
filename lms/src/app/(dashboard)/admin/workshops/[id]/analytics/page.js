"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Award, ArrowLeft, Loader2, Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function WorkshopAnalyticsPage({ params }) {
  const { id: workshopId } = use(params)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/workshops/${workshopId}/analytics`)
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.error) setData(resData)
      })
      .catch((err) => console.error("Failed to load workshop analytics:", err))
      .finally(() => setLoading(false))
  }, [workshopId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
        <span>Loading cohort analytics & leaderboard...</span>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Analytics Unavailable</h2>
        <Link href={`/admin/workshops/${workshopId}`}>
          <Button variant="outline">Back to Control Room</Button>
        </Link>
      </div>
    )
  }

  const { workshop, leaderboard, assignmentStats, inactiveCount } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/workshops/${workshopId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Control Room
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              {workshop.name} — Cohort Leaderboard & Analytics
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Class rankings, submission performance metrics, and student activity tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Enrolled</span>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{workshop.studentCount}</p>
          <p className="text-[11px] text-gray-400">Cohort participants</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Published Tasks</span>
          <p className="text-3xl font-extrabold text-blue-600">{workshop.taskCount}</p>
          <p className="text-[11px] text-gray-400">Max {workshop.totalMaxPossibleMarks} pts</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Performer Score</span>
          <p className="text-3xl font-extrabold text-amber-600">{leaderboard[0]?.totalPoints || 0}</p>
          <p className="text-[11px] text-gray-400 truncate">{leaderboard[0]?.name || "N/A"}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inactive Students</span>
          <p className="text-3xl font-extrabold text-red-600">{inactiveCount}</p>
          <p className="text-[11px] text-gray-400">0 submissions uploaded</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Leaderboard Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Student Leaderboard Rankings
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[10px]">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Completed Tasks</th>
                  <th className="p-3">Total Submissions</th>
                  <th className="p-3 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No enrollees in this workshop cohort.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-3 font-bold text-sm">
                        {idx === 0 ? (
                          <span className="text-amber-500 flex items-center gap-1">🥇 #1</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-400 flex items-center gap-1">🥈 #2</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-700 flex items-center gap-1">🥉 #3</span>
                        ) : (
                          <span className="text-gray-500">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                            {student.name?.[0] || "S"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{student.name}</p>
                            <p className="text-gray-400 text-[11px]">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                        {student.completedTasks} / {workshop.taskCount}
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400">{student.submissionsCount}</td>
                      <td className="p-3 text-right font-extrabold text-sm text-green-700 dark:text-green-400">
                        {student.totalPoints} pts
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Per-Assignment Average Bar Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Task Averages
          </h3>

          <div className="space-y-4">
            {assignmentStats.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No assignments created for this cohort.
              </div>
            ) : (
              assignmentStats.map((item) => {
                const pct = item.maxMarks > 0 ? (item.averageScore / item.maxMarks) * 100 : 0
                return (
                  <div key={item.id} className="space-y-1.5 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.title}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {item.averageScore} / {item.maxMarks}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">{item.gradedCount} graded submissions</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
