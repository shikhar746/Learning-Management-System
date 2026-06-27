import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
    console.log("JWT CALLBACK — token:", token, "user:", user)
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    ///asdgdfgadgfa
    session({ session, token }) {
    console.log("SESSION CALLBACK — session:", session, "token:", token)
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
})