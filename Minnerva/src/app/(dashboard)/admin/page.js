"use client"

import useSWR from "swr"
import AnalyticsCards from "@/components/shared/AnalyticsCards"
import { Calendar, Loader2, GraduationCap, Users, UserX, ShieldCheck, ArrowRight } from "lucide-react"
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

  // RULE 5: Platform-wide aggregate view rendered strictly for OWNER role
  if (data?.isAggregate) {
    return (
      <div className="space-y-8 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Super-Admin Platform Aggregate</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform-wide system metrics aggregated across all active workshop cohorts.
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

  // RULE 4: Admin stats aggregation — DO NOT SUM across workshops.
  // Render separate per-workshop results independently.
  const perWorkshopResults = data?.perWorkshopResults || []

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assigned Cohort Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Independent per-workshop performance metrics, enrollment counts, and instructors.
        </p>
      </div>

      {perWorkshopResults.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center text-gray-400">
          <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          No assigned workshops found for your account.
        </div>
      ) : (
        <div className="space-y-6">
          {perWorkshopResults.map((ws) => (
            <div
              key={ws.workshop_id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{ws.workshop_name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      Invite Code: <span className="text-blue-600 dark:text-blue-400 font-bold">{ws.workshop_code}</span>
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/workshops/${ws.workshop_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage Cohort <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Per-Workshop Independent Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <span>Registered</span>
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{ws.registered_count}</p>
                  <p className="text-[11px] text-gray-400">Enrolled students</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <span>Unregistered</span>
                    <UserX className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{ws.non_registered_count}</p>
                  <p className="text-[11px] text-gray-400">Outside this cohort</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <span>Pending Tasks</span>
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{ws.pendingSubmissionsCount}</p>
                  <p className="text-[11px] text-gray-400">Awaiting grading</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <span>Cohort Average</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{ws.averageScore}</p>
                  <p className="text-[11px] text-gray-400">Average score</p>
                </div>
              </div>

              {/* Assigned Admins List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Assigned Instructors ({ws.admin_list.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ws.admin_list.map((admin) => (
                    <div
                      key={admin.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {admin.name?.[0] || "A"}
                      </div>
                      <span className="font-semibold">{admin.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({admin.email})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines in this Workshop */}
              {ws.upcomingDeadlines.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Upcoming Deadlines in {ws.workshop_name}
                  </h4>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {ws.upcomingDeadlines.map((task) => (
                      <div key={task.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{task.title}</span>
                        <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded font-medium border border-amber-200 dark:border-amber-900 text-[11px]">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
