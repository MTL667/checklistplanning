import prisma from '../../utils/prisma'

/**
 * POST /api/admin/stop-impersonate
 * Stop impersonating and return to admin account
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Check if currently impersonating
  if (!session.user.isImpersonating || !session.user.originalUserId) {
    throw createError({
      statusCode: 400,
      message: 'Not currently impersonating'
    })
  }

  // Get the original admin user
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.originalUserId }
  })

  if (!adminUser) {
    throw createError({
      statusCode: 404,
      message: 'Original user not found'
    })
  }

  // Restore original session
  await setUserSession(event, {
    user: {
      id: adminUser.id,
      entraId: adminUser.entraId,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    }
  })

  return {
    success: true,
    user: {
      id: adminUser.id,
      name: adminUser.name,
      role: adminUser.role
    }
  }
})
