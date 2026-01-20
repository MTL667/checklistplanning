/**
 * Auth middleware - protects routes that require authentication
 * Use by adding: definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  // If not logged in, redirect to login
  if (!loggedIn.value) {
    return navigateTo('/', { replace: true })
  }
})
