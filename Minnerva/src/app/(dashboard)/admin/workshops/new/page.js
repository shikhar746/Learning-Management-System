import WorkshopForm from "@/components/admin/WorkshopForm"

export default function NewWorkshopPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Workshop Cohort</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set up a new workshop tenant, validity timeframe, and custom or auto-assigned invite code.
        </p>
      </div>

      <WorkshopForm />
    </div>
  )
}
