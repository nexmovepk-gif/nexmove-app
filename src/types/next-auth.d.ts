// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'
import { Role } from '../generated/client/enums'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      agencyId: string | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: Role
    agencyId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    agencyId: string | null
  }
}
