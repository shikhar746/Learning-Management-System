"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Eye, Trash2, Calendar, FileText, Loader2 } from "lucide-react"

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments")
      const data = await res.json()
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return

    try {
      await fetch(`/api/assignments/${id}`, { method: "DELETE" })
      fetchAssignments()
    } catch (err) {
      console.error(err)
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignment Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create, publish, edit, and evaluate student assignments.</p>
        </div>
        <Link href="/admin/assignments/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Assignment
          </Button>
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No assignments created yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Get started by creating your first course assignment.</p>
          <Link href="/admin/assignments/new">
            <Button variant="outline">Create New Assignment</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 text-base truncate">{assignment.title}</h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        assignment.published
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {assignment.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No deadline"}
                    </span>
                    <span>Max Marks: {assignment.maxMarks}</span>
                    <span>Submissions: {assignment._count?.submissions || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/assignments/${assignment.id}/submissions`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      Submissions
                    </Button>
                  </Link>
                  <Link href={`/admin/assignments/${assignment.id}/edit`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
