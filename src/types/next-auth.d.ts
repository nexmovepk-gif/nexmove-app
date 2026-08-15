// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'
import { Role } from '../generated/client/enums'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role | string
      accountRoleType?: string | null
      agencyId: string | null
      agencyName?: string | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: Role | string
    accountRoleType?: string | null
    agencyId: string | null
    agencyName?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role | string
    accountRoleType?: string | null
    agencyId: string | null
    agencyName?: string | null
  }
}
