"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Mail, ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"

export default function WorkshopCloseoutBanner({ workshopName, adminEmails = [], validUntil }) {
  const daysLeft = validUntil
    ? Math.max(0, Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 30

  return (
    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto my-8 space-y-6 text-center shadow-xl">
      <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
        <Clock className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          Workshop Concluded
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          {workshopName} is Over
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Thank you for participating! Submissions are now closed, but your materials and certificates remain accessible in read-only mode.
        </p>
      </div>

      {validUntil && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Page will remain live in read-only mode for <strong className="text-white">{daysLeft} more days</strong>.</span>
        </div>
      )}

      {adminEmails.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Contact Instructors</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {adminEmails.map((email, idx) => (
              <a
                key={idx}
                href={`mailto:${email}`}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{email}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 flex items-center justify-center gap-3">
        <Link href="/login">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Button>
        </Link>
      </div>
    </div>
  )
}
