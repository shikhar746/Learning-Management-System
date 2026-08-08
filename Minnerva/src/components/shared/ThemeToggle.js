"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-xs font-semibold"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  )
}
