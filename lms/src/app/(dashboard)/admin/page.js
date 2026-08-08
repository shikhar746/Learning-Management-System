"use client"

import useSWR from "swr"
import AnalyticsCards from "@/components/shared/AnalyticsCards"
import { Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { fetcher, cacheKeys } from "@/lib/swr"

export default function AdminDashboardPage() {
  const { data, isLoading: loading } = useSWR(cacheKeys.analytics(), fetcher, {
    dedupingInterval: 10000,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        Loading analytics dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Analytics Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor course statistics, class averages, and upcoming assignment deadlines.
        </p>
      </div>

      <AnalyticsCards data={data} role="admin" />

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Upcoming Assignment Deadlines
        </h3>

        {data?.upcomingDeadlines?.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No upcoming deadlines.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data?.upcomingDeadlines?.map((assignment) => (
              <div key={assignment.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{assignment.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Max Marks: {assignment.maxMarks}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full font-medium border border-amber-200 dark:border-amber-900">
                    Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No deadline"}
                  </span>
                  <Link
                    href={`/admin/assignments/${assignment.id}/submissions`}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Submissions →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
