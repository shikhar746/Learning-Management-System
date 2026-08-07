"use client"

import { useEffect, useState, use } from "react"
import SubmissionModal from "@/components/dashboard/SubmissionModal"
import { Loader2, ArrowLeft, Calendar, Award, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StudentAssignmentDetailPage({ params }) {
  const { id } = use(params)
  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/assignments/${id}`)
      const data = await res.json()
      setAssignment(data)
      setSubmissions(data.userSubmissions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        Loading assignment...
      </div>
    )
  }

  if (!assignment) {
    return <div className="py-12 text-center text-gray-500">Assignment not found</div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/student/assignments">
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Details Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed">{assignment.description}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No deadline"}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-600" />
                Max Marks: {assignment.maxMarks}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Submission Instructions</h3>
            <div className="prose prose-sm text-gray-700 whitespace-pre-wrap font-sans">
              {assignment.instructions}
            </div>

            {assignment.attachments?.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Course Materials</h4>
                {assignment.attachments.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 underline hover:text-blue-800"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {url}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submission Form Column */}
        <div className="space-y-6">
          <SubmissionModal
            assignment={assignment}
            previousSubmissions={submissions}
            onSubmitted={() => fetchData()}
          />
        </div>
      </div>
    </div>
  )
}
