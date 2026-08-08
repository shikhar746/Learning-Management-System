"use client"

import useSWR from "swr"
import Link from "next/link"
import { Calendar, FileText, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react"
import { fetcher, cacheKeys } from "@/lib/swr"

export default function StudentAssignmentsPage() {
  const { data: assignments, isLoading: loadingAssignments } = useSWR(
    cacheKeys.assignments(),
    fetcher,
    { dedupingInterval: 10000 }
  )

  const { data: submissions, isLoading: loadingSubmissions } = useSWR(
    cacheKeys.submissions(),
    fetcher,
    { dedupingInterval: 10000 }
  )

  const loading = loadingAssignments || loadingSubmissions
  const assignmentList = Array.isArray(assignments) ? assignments : []
  const submissionList = Array.isArray(submissions) ? submissions : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        Loading assignments...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Assignments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review requirements, submission deadlines, and submit your project solutions.
        </p>
      </div>

      {assignmentList.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          No published assignments available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assignmentList.map((assignment) => {
            const userSub = submissionList.find((s) => s.assignmentId === assignment.id)

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-sm transition-shadow flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base truncate">
                      {assignment.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No deadline"}
                    </span>
                    <span>Max Marks: {assignment.maxMarks}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {userSub ? (
                    userSub.isGradePublished && userSub.totalScore !== null ? (
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-3 py-1 rounded-full border border-green-200 dark:border-green-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Score: {userSub.totalScore}/{assignment.maxMarks}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Submitted (v{userSub.version})
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}

                  <Link
                    href={`/student/assignments/${assignment.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {userSub ? "View / Resubmit" : "Open Assignment"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}