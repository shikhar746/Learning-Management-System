import CreateAssignmentForm from "@/components/dashboard/CreateAssignmentForm"

export default function NewAssignmentPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create Assignment
        </h1>
        <p className="text-gray-500 mt-1">
          Fill in the details to publish a new Assignment
        </p>
      </div>
      <CreateAssignmentForm />
    </div>
  )
}