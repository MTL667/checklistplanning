import { createMsalClient, getRedirectUri, SCOPES } from '../../utils/auth'

/**
 * GET /auth/microsoft
 * Redirects user to Microsoft Entra ID login
 */
export default defineEventHandler(async (event) => {
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
})
