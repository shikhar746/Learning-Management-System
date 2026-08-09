import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { rawDb } from "@/lib/db"
import { authConfig } from "@/lib/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "minnerva_default_auth_secret_32_bytes_long!!",
  adapter: PrismaAdapter(rawDb),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "placeholder_google_client_id",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "placeholder_google_client_secret",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await rawDb.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValidPassword) {
          return null
        }

        return user
      },
    }),
  ],
})