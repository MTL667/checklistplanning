/**
 * Admin middleware - protects routes that require admin role
 * Use by adding: definePageMeta({ middleware: ['auth', 'admin'] })
 */
export default defineNuxtRouteMiddleware(async () => {
  const { user, loggedIn } = useUserSession()

  // Must be logged in
  if (!loggedIn.value) {
    return navigateTo('/', { replace: true })
  }

  // Must be admin
  if (user.value?.role !== 'ADMIN') {
    return navigateTo('/dashboard', { replace: true })
  }
})
