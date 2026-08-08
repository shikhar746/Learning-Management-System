"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "Are you sure you want to delete this? This action cannot be undone.",
  loading = false,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-5 transform transition-all scale-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <Button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
