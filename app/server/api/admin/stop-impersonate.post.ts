import prisma from '../../utils/prisma'

/**
 * POST /api/admin/stop-impersonate
 * Stop impersonating and return to admin account
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Check if currently impersonating - be more lenient
  const originalUserId = session.user.originalUserId
  if (!originalUserId) {
    // If no originalUserId, clear any impersonation flags and return current user
    console.log('No originalUserId found, session:', JSON.stringify(session.user))
    throw createError({
      statusCode: 400,
      message: 'Not currently impersonating'
    })
  }

  // Get the original admin user
  const adminUser = await prisma.user.findUnique({
    where: { id: originalUserId }
  })

  if (!adminUser) {
    throw createError({
      statusCode: 404,
      message: 'Original user not found'
    })
  }

  // Restore original session - completely replace, don't merge
  await setUserSession(event, {
    user: {
      id: adminUser.id,
      entraId: adminUser.entraId,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
      // Explicitly NOT including isImpersonating or originalUserId
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
