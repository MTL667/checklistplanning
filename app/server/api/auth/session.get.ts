/**
 * GET /api/auth/session
 * Returns the current user session
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    return { user: null }
  }

  return {
    user: session.user,
    loggedInAt: session.loggedInAt
  }
})
