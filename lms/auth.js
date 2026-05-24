import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

let adapter
try {
  adapter = PrismaAdapter(db)
  console.log("Adapter initialized OK")
} catch (e) {
  console.error("ADAPTER ERROR:", e.message)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      return session
    },
  },
  debug: true,
})