import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-gray-500">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
      <span>Loading portal view...</span>
    </div>
  )
}
