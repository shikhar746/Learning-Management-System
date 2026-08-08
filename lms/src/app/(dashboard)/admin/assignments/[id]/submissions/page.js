"use client"

import { useEffect, useState, use } from "react"
import GradingModal from "@/components/admin/GradingModal"
import { Loader2, ArrowLeft, Award, FileText, CheckCircle2, Clock, Sparkles, Send, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminSubmissionsPage({ params }) {
  const { id } = use(params)
  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchMsg, setBatchMsg] = useState({ error: "", success: "" })

  const fetchData = async () => {
    try {
      const [assignRes, subRes] = await Promise.all([
        fetch(`/api/assignments/${id}`),
        fetch(`/api/submissions?assignmentId=${id}`),
      ])

      const assignData = await assignRes.json()
      const subData = await subRes.json()

      setAssignment(assignData)
      setSubmissions(Array.isArray(subData) ? subData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleBatchAction = async (action) => {
    setBatchLoading(true)
    setBatchMsg({ error: "", success: "" })

    try {
      const res = await fetch("/api/admin/submissions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: id, action }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Batch action failed")
      }

      setBatchMsg({ success: data.message, error: "" })
      fetchData()
    } catch (err) {
      setBatchMsg({ error: err.message, success: "" })
    } finally {
      setBatchLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        Loading submissions...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/assignments">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Assignments
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleBatchAction("AI_DRAFT_ALL")}
            disabled={batchLoading || submissions.length === 0}
            variant="outline"
            size="sm"
            className="border-purple-300 text-purple-800 hover:bg-purple-50 flex items-center gap-1.5 text-xs font-semibold"
          >
            {batchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
            Batch AI Draft All
          </Button>

          <Button
            onClick={() => handleBatchAction("PUBLISH_ALL")}
            disabled={batchLoading || submissions.length === 0}
            size="sm"
            className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            {batchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Bulk Publish All Grades
          </Button>
        </div>
      </div>

      {batchMsg.error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{batchMsg.error}</span>
        </div>
      )}

      {batchMsg.success && (
        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{batchMsg.success}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assignment?.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{assignment?.description}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 block">Total Submissions</span>
          <span className="text-2xl font-bold text-gray-900">{submissions.length}</span>
        </div>
      </div>

      {selectedSubmission ? (
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSubmission(null)}
          >
            ← Back to Submissions List
          </Button>
          <GradingModal
            submission={selectedSubmission}
            assignment={assignment}
            onGraded={(updated) => {
              setSelectedSubmission(null)
              fetchData()
            }}
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Submissions Queue</h3>
            <span className="text-xs text-gray-400 font-medium">
              {submissions.filter((s) => s.isGradePublished).length} / {submissions.length} Published
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No submissions uploaded by students yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {sub.user?.name?.[0] || "S"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {sub.user?.name || "Student"} ({sub.user?.email})
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()} • Version v{sub.version}
                        {sub.aiSuggestedScore !== null && !sub.isGradePublished && (
                          <span className="ml-2 text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
                            AI Draft: {sub.aiSuggestedScore} pts
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {sub.isGradePublished && sub.totalScore !== null ? (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {sub.totalScore} / {assignment.maxMarks}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Needs Grading
                      </span>
                    )}

                    <Button
                      size="sm"
                      onClick={() => setSelectedSubmission(sub)}
                      className="flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Evaluate & Grade
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
