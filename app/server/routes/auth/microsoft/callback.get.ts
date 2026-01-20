import { createMsalClient, getRedirectUri, SCOPES, parseIdTokenClaims, type UserSession } from '../../utils/auth'
import prisma from '../../utils/prisma'

/**
 * GET /auth/microsoft/callback
 * Handles the OAuth callback from Microsoft Entra ID
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const state = query.state as string
  const error = query.error as string
  const errorDescription = query.error_description as string

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return sendRedirect(event, `/?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return sendRedirect(event, '/?error=no_code')
  }

  // Validate state (CSRF protection)
  const session = await getUserSession(event)
  if (!session?.oauthState || session.oauthState !== state) {
    console.error('State mismatch:', { expected: session?.oauthState, received: state })
    return sendRedirect(event, '/?error=state_mismatch')
  }

  try {
    const msalClient = createMsalClient()
    const redirectUri = getRedirectUri(event)

    // Exchange code for tokens
    const result = await msalClient.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri
    })

    // Parse user info from ID token
    const claims = parseIdTokenClaims(result)

    if (!claims.oid || !claims.email) {
      console.error('Missing required claims:', claims)
      return sendRedirect(event, '/?error=invalid_claims')
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { entraId: claims.oid }
    })

    if (!user) {
      // Check if user exists by email (for migration cases)
      user = await prisma.user.findUnique({
        where: { email: claims.email }
      })

      if (user) {
        // Update existing user with Entra ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: { entraId: claims.oid, name: claims.name }
        })
      } else {
        // Create new user (default role: PLANNER)
        user = await prisma.user.create({
          data: {
            entraId: claims.oid,
            email: claims.email,
            name: claims.name,
            role: 'PLANNER',
            locale: 'nl'
          }
        })
      }
    } else {
      // Update user name if changed
      if (user.name !== claims.name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: claims.name }
        })
      }
    }

    // Set user session
    const userSession: UserSession = {
      user: {
        id: user.id,
        entraId: user.entraId,
        email: user.email,
        name: user.name,
        role: user.role,
        locale: user.locale
      },
      loggedInAt: Date.now()
    }

    await setUserSession(event, userSession)

    // Redirect to dashboard or home
    return sendRedirect(event, '/dashboard')
  } catch (err) {
    console.error('Token exchange error:', err)
    return sendRedirect(event, '/?error=token_exchange_failed')
  }
})
