import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { config } from '@/lib/config'
import { buildSessionPayload, verifyCredentials } from './auth/auth.service'
import type { Role } from '@/types'

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const roles: Role[] = ['ADMIN', 'GURU', 'SISWA']

function isRole(value: unknown): value is Role {
  return roles.some((role) => role === value)
}

export const credentialsProvider = Credentials({
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    const parsedCredentials = CredentialsSchema.safeParse(credentials)
    if (!parsedCredentials.success) return null

    const authResult = await verifyCredentials(parsedCredentials.data)
    if (!authResult.success) return null

    const user = await buildSessionPayload(parsedCredentials.data.email)
    if (!user.isActive) return null

    return {
      id: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  },
})

export const authConfig: NextAuthConfig = {
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.SESSION_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: config.session.durationSeconds,
  },
  providers: [credentialsProvider],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        if (!isRole(user.role)) {
          throw new Error('Authenticated user has an invalid role')
        }

        token.id = user.id
        token.sub = user.id
        token.role = user.role
      }

      return token
    },
    session({ session, token }) {
      if (typeof token.id !== 'string' || !isRole(token.role)) {
        throw new Error('Authenticated token is missing user identity')
      }

      session.user = {
        ...session.user,
        id: token.id,
        role: token.role,
      }

      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
