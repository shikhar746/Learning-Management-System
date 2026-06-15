import CreateTutorialForm from "@/components/dashboard/CreateTutorialForm"

export default function NewTutorialPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create Tutorial
        </h1>
        <p className="text-gray-500 mt-1">
          Fill in the details to publish a new tutorial
        </p>
      </div>
      <CreateTutorialForm />
    </div>
  )
}