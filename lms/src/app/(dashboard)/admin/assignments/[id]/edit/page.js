"use client"

import { useEffect, useState, use } from "react"
import AssignmentForm from "@/components/dashboard/AssignmentForm"
import { Loader2 } from "lucide-react"

export default function EditAssignmentPage({ params }) {
  const { id } = use(params)
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/assignments/${id}`)
      .then((res) => res.json())
      .then((data) => setAssignment(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        Loading assignment details...
      </div>
    )
  }

  if (!assignment) {
    return <div className="py-12 text-center text-gray-500">Assignment not found</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Assignment</h1>
        <p className="text-sm text-gray-500 mt-1">Update instructions, deadline, or resource attachments.</p>
      </div>

      <AssignmentForm initialData={assignment} isEditing={true} />
    </div>
  )
}
