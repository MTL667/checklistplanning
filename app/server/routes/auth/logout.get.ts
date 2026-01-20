/**
 * GET /auth/logout
 * Clears user session and redirects to home
 * (Convenience route for direct browser access)
 */
export default defineEventHandler(async (event) => {
  // Clear the user session
  await clearUserSession(event)

  // Redirect to home page
  return sendRedirect(event, '/')
})
