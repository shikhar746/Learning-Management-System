import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminAssignmentsPage() {
  const assignments = await db.assignment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
          <p className="text-gray-500 mt-1">{assignments.length} total</p>
        </div>
        <Link href="/admin/assignments/new">
          <Button>+ New Assignment</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No assignments yet. Create your first one!
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-gray-900">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Due: {a.dueDate
                    ? new Date(a.dueDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No due date"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max marks: {a.maxMarks} · Resubmission {a.allowResubmission ? "allowed" : "not allowed"}
                </p>
                <span className="text-xs text-gray-400 mt-1 inline-block">
                  {a.published ? "Published" : "Draft"}
                </span>
              </div>
              <Link href={`/admin/assignments/${a.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}