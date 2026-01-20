import { createMsalClient, getRedirectUri, SCOPES, getMsalConfig } from '../../utils/auth'

/**
 * GET /auth/microsoft
 * Redirects user to Microsoft Entra ID login
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Check if Entra ID is configured
  if (!config.entraClientId || !config.entraClientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Microsoft Entra ID is not configured. Please set NUXT_ENTRA_CLIENT_ID and NUXT_ENTRA_CLIENT_SECRET environment variables.'
    })
  }

  try {
    const msalClient = createMsalClient()
    const redirectUri = getRedirectUri(event)

    // Generate a unique state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in session for validation on callback
    await setUserSession(event, {
      oauthState: state
    } as any)

    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri,
      state,
      prompt: 'select_account' // Allow user to select account
    })

    return sendRedirect(event, authUrl)
  } catch (error: any) {
    console.error('Microsoft auth error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Authentication failed: ${error.message || 'Unknown error'}`
    })
  }
})
