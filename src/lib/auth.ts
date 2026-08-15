// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { Role } from '../generated/client/enums'
import bcrypt from 'bcryptjs'

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

        const email = credentials.email.toLowerCase().trim()

        try {
          // Direct Supabase PostgreSQL database query
          const dbUser = await prisma.user.findUnique({
            where: { email },
            include: { agency: true },
          })

          if (dbUser && dbUser.password) {
            let isMatch = false
            try {
              isMatch = await bcrypt.compare(credentials.password, dbUser.password)
            } catch {
              isMatch = false
            }

            // Fallback for legacy plain text records: auto-migrate to bcrypt hash
            if (!isMatch && dbUser.password === credentials.password) {
              isMatch = true
              try {
                const upgradedHash = await bcrypt.hash(credentials.password, 10)
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: { password: upgradedHash },
                })
              } catch (migrationErr) {
                console.warn('Could not auto-migrate password hash:', migrationErr)
              }
            }

            if (isMatch) {
              return {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                role: String(dbUser.role),
                agencyId: dbUser.agencyId ?? null,
                agencyName: dbUser.agency?.name ?? null,
              }
            }
          }
        } catch (error) {
          console.error('Database query failed during NextAuth authorize:', error)
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

        // 👑 Master Super Admin Override
        if (u.email === 'nexmove.pk@gmail.com') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ; (token as any).role = 'SUPER_ADMIN'
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ; (token as any).role = u.role ?? null
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (token as any).agencyId = u.agencyId ?? null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ; (token as any).agencyName = u.agencyName ?? null
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
    maxAge: 8 * 60 * 60, // 8 hours maximum active session limit
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Omitting maxAge so the cookie is treated as a Session Cookie by browsers (cleared on browser/app close)
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
}