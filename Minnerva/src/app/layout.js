import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "@/components/providers/Providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Minnerva",
  description: "Workshops, assignments, and AI-powered code review",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}