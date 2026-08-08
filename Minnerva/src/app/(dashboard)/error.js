"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function DashboardError({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl p-8 max-w-md mx-auto my-12 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <h2 className="text-xl font-bold text-gray-900">Something went wrong!</h2>
      <p className="text-xs text-gray-500">{error?.message || "An unexpected error occurred while loading this view."}</p>
      <Button onClick={() => reset()} variant="outline">
        Try Again
      </Button>
    </div>
  )
}
