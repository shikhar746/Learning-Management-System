import AssignmentForm from "@/components/dashboard/AssignmentForm"

export default function NewAssignmentPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Assignment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Publish instructions, upload starter files, and configure submission deadlines.
        </p>
      </div>

      <AssignmentForm />
    </div>
  )
}
