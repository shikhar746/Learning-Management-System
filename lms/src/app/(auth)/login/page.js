"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LoginPage() {

  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
        <p className="text-gray-500 text-sm mb-8">
          Sign in to your LMS account using Google
        </p>
        {error === "not_admin" && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
            This account isn't registered as an admin.
            </div>)
        }
        <div className = "space-y-3">
          <Button
            className = "w-full flex items-center gap-3"
            onClick ={()=>signIn("google",{redirectTo : "/auth/redirect/student"})}
          >
            Continue as Student
          </Button>
          <Button
            variant = "outline"
            className = "w-full flex items-center gap-3"
            onClick = {()=>signIn("google",{redirectTo: "/auth/redirect/admin"})}
          >
            Continue as Admin
          </Button>
        </div>
      </div>
    </div>
  )
}