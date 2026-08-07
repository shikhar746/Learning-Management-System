"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, FileText, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react"

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments").then((res) => res.json()),
      fetch("/api/submissions").then((res) => res.json()),
    ])
      .then(([assignData, subData]) => {
        setAssignments(Array.isArray(assignData) ? assignData : [])
        setSubmissions(Array.isArray(subData) ? subData : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
        <h1 className="text-2xl font-bold text-gray-900">Your Assignments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review requirements, submission deadlines, and submit your project solutions.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          No published assignments available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const userSub = submissions.find((s) => s.assignmentId === assignment.id)

            return (
              <div
                key={assignment.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 text-base truncate">
                      {assignment.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{assignment.description}</p>
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
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Score: {userSub.totalScore}/{assignment.maxMarks}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Submitted (v{userSub.version})
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
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