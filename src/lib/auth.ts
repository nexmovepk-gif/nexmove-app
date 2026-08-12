// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { Role } from '../generated/client/enums'

declare module 'next-auth' {
  // Extend Session.user with our custom fields
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string | null
      agencyId?: string | null
      agencyName?: string | null
    }
  }
}

// Internal user shape returned by the authorize callback
interface AdaptedUser {
  id: string
  email: string
  name: string | null
  role: string
  agencyId: string | null
  agencyName: string | null
}

export interface RegisteredUser {
  id: string
  email: string
  name: string
  password?: string
  role: Role
  agencyId?: string | null
  agencyName?: string | null
}

export const REGISTERED_USERS: RegisteredUser[] = []

const MOCK_USERS: RegisteredUser[] = [
  {
    id: 'super-admin-id',
    email: 'superadmin@nexmove.com',
    name: 'Ali Hamza (Super Admin)',
    password: 'admin123',
    role: 'SUPER_ADMIN' as Role,
    agencyId: null,
    agencyName: 'NexMove Admin HQ',
  },
  {
    id: 'manager-1-id',
    email: 'manager1@agency1.com',
    name: 'Manager One',
    password: 'manager123',
    role: 'AGENCY_MANAGER' as Role,
    agencyId: 'agency-1',
    agencyName: 'Apex Real Estate',
  },
  {
    id: 'agent-1-id',
    email: 'agent1@agency1.com',
    name: 'Agent One',
    password: 'agent123',
    role: 'AGENCY_AGENT' as Role,
    agencyId: 'agency-1',
    agencyName: 'Apex Real Estate',
  },
  {
    id: 'manager-2-id',
    email: 'manager2@agency2.com',
    name: 'Manager Two',
    password: 'manager123',
    role: 'AGENCY_MANAGER' as Role,
    agencyId: 'agency-2',
    agencyName: 'Skyline Properties',
  },
  {
    id: 'agent-2-id',
    email: 'agent2@agency2.com',
    name: 'Agent Two',
    password: 'agent123',
    role: 'AGENCY_AGENT' as Role,
    agencyId: 'agency-2',
    agencyName: 'Skyline Properties',
  },
  {
    id: 'public-user-id',
    email: 'user@public.com',
    name: 'Public User',
    password: 'user123',
    role: 'PUBLIC_USER' as Role,
    agencyId: null,
    agencyName: null,
  },
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 1. Check in-memory registered users first
        const regUser = REGISTERED_USERS.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password
        )
        if (regUser) {
          return {
            id: regUser.id,
            email: regUser.email,
            name: regUser.name,
            role: String(regUser.role),
            agencyId: regUser.agencyId ?? null,
            agencyName: regUser.agencyName ?? null,
          }
        }

        // 2. Check static MOCK_USERS
        const mockUser = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password
        )
        if (mockUser) {
          return {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: String(mockUser.role),
            agencyId: mockUser.agencyId ?? null,
            agencyName: mockUser.agencyName ?? null,
          }
        }

        // 3. Check database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { agency: true },
          })

          if (dbUser && dbUser.password === credentials.password) {
            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              role: String(dbUser.role),
              agencyId: dbUser.agencyId ?? null,
              agencyName: dbUser.agency?.name ?? null,
            }
          }
        } catch (error) {
          console.warn('Database connection failed, using mock auth flow only', error)
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AdaptedUser
        token.id = u.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(token as any).role = u.role ?? null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(token as any).agencyId = u.agencyId ?? null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(token as any).agencyName = u.agencyName ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.agencyId = token.agencyId as string | null
        session.user.agencyName = token.agencyName as string | null
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
}
