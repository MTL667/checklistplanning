/**
 * POST /auth/logout
 * Clears user session and redirects to home
 */
export default defineEventHandler(async (event) => {
  // Clear the user session
  await clearUserSession(event)

  return { success: true }
})
