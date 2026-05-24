import Link from "next/link"

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-800",
  },
  graded: {
    label: "Graded",
    className: "bg-green-100 text-green-800",
  },
}

export default function AssignmentList({ assignments }) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">No assignments yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => {
        const status = statusConfig[assignment.status] || statusConfig.pending
        return (
          <Link
            key={assignment.id}
            href={`/student/assignments/${assignment.id}`}
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {assignment.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {assignment.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Due: {assignment.dueDate}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${status.className}`}
                >
                  {status.label}
                </span>
                {assignment.score !== null && (
                  <span className="text-sm font-semibold text-gray-700">
                    {assignment.score}/100
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}