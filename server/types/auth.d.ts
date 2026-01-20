import type { Role, Locale } from '~/types'

declare module '#auth-utils' {
  interface User {
    id: string
    entraId: string
    email: string
    name: string
    role: Role
    locale: Locale
  }

  interface UserSession {
    user?: User
    loggedInAt?: number
    oauthState?: string
  }
}

export {}
