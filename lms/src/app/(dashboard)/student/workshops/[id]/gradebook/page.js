"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Award, ArrowLeft, Loader2, CheckCircle2, Clock, FileText, ExternalLink, GitBranch, Video, AlertCircle } from "lucide-react"

export default function StudentGradebookPage({ params }) {
  const { id: workshopId } = use(params)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/student/workshops/${workshopId}/gradebook`)
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.error) setData(resData)
      })
      .catch((err) => console.error("Failed to load gradebook:", err))
      .finally(() => setLoading(false))
  }, [workshopId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading your gradebook transcript...</span>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Gradebook Unavailable</h2>
        <Link href="/student/workshops">
          <Button variant="outline">Back to Workshops</Button>
        </Link>
      </div>
    )
  }

  const { workshop, student, summary, certificate, gradebookRows } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/student/workshops">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Workshops
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workshop.name} — Gradebook</h1>
            <p className="text-xs text-gray-500">
              Official academic transcript & submission score breakdown for {student.name || student.email}.
            </p>
          </div>
        </div>

        {summary.hasCertificate ? (
          <Link href={`/student/workshops/${workshop.id}/certificate`}>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
              <Award className="w-4 h-4" /> View Certificate
            </Button>
          </Link>
        ) : (
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
            Cohort Code: {workshop.code}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Grade</span>
          <p className="text-3xl font-extrabold text-blue-600">{summary.overallPercentage}%</p>
          <p className="text-[11px] text-gray-400">
            {summary.totalEarnedMarks} / {summary.totalMaxMarks} total points earned
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Graded Tasks</span>
          <p className="text-3xl font-extrabold text-gray-900">{summary.gradedCount} / {summary.taskCount}</p>
          <p className="text-[11px] text-gray-400">Evaluated by instructors</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1 text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate Status</span>
          <p className="text-xl font-bold text-gray-900 pt-1">
            {summary.hasCertificate ? (
              <span className="text-amber-600 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-amber-500" /> Issued
              </span>
            ) : (
              <span className="text-gray-400 font-medium text-sm">Pending Completion</span>
            )}
          </p>
          <p className="text-[11px] text-gray-400">Official completion credentials</p>
        </div>
      </div>

      {/* Gradebook Transcript Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Assignment Scores & Instructor Feedback</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold text-[10px]">
                <th className="p-3">Assignment Title</th>
                <th className="p-3">Submitted Version</th>
                <th className="p-3">Submitted Artifacts</th>
                <th className="p-3">Status</th>
                <th className="p-3">Marks Score</th>
                <th className="p-3">Instructor Feedback</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gradebookRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No published assignments in this workshop cohort.
                  </td>
                </tr>
              ) : (
                gradebookRows.map((row) => {
                  const sub = row.submission
                  const isGraded = sub && sub.isGradePublished && sub.totalScore !== null
                  return (
                    <tr key={row.assignmentId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 font-semibold text-gray-900">{row.title}</td>
                      <td className="p-3">
                        {sub ? (
                          <span className="bg-blue-50 text-blue-800 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                            v{sub.version}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {sub ? (
                          <div className="flex items-center gap-2">
                            {sub.repoUrl && <GitBranch className="w-3.5 h-3.5 text-gray-500" title="GitHub Repo" />}
                            {sub.deploymentUrl && <ExternalLink className="w-3.5 h-3.5 text-blue-500" title="Live Demo" />}
                            {sub.driveUrl && <Video className="w-3.5 h-3.5 text-purple-500" title="Drive Video Link" />}
                          </div>
                        ) : (
                          <span className="text-gray-400">No submission</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isGraded
                              ? "bg-green-100 text-green-800"
                              : sub
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isGraded ? "GRADED" : sub ? "SUBMITTED" : "PENDING"}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-gray-900">
                        {isGraded ? (
                          <span className="text-green-700 font-bold">
                            {sub.totalScore} / {row.maxMarks}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">— / {row.maxMarks}</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 max-w-xs truncate italic">
                        {isGraded && sub.feedback ? `"${sub.feedback}"` : <span className="text-gray-400 not-italic">No feedback yet</span>}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/student/assignments/${row.assignmentId}`}>
                          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2">
                            {sub ? "View Submission" : "Submit Work"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
