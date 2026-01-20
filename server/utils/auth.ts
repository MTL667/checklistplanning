import { ConfidentialClientApplication, type AuthenticationResult } from '@azure/msal-node'
import type { H3Event } from 'h3'

// Microsoft Entra ID configuration
export function getMsalConfig() {
  const config = useRuntimeConfig()

  return {
    auth: {
      clientId: config.entraClientId,
      authority: `https://login.microsoftonline.com/${config.entraTenantId}`,
      clientSecret: config.entraClientSecret
    }
  }
}

// Create MSAL client
export function createMsalClient() {
  return new ConfidentialClientApplication(getMsalConfig())
}

// Get the redirect URI based on the request
export function getRedirectUri(event: H3Event): string {
  const config = useRuntimeConfig()
  return `${config.public.appUrl}/auth/microsoft/callback`
}

// Microsoft Graph scopes for user info
export const SCOPES = ['openid', 'profile', 'email', 'User.Read']

// Type for the user session
export interface UserSession {
  user: {
    id: string
    entraId: string
    email: string
    name: string
    role: 'ADMIN' | 'PLANNER'
    locale: 'nl' | 'fr'
  }
  loggedInAt: number
}

// Parse ID token claims
export function parseIdTokenClaims(result: AuthenticationResult) {
  const claims = result.idTokenClaims as Record<string, unknown>

  return {
    oid: claims.oid as string, // Object ID (unique user identifier)
    email: (claims.email || claims.preferred_username || claims.upn) as string,
    name: claims.name as string || 'Unknown User'
  }
}
