import prisma from '../../utils/prisma'

/**
 * POST /api/admin/impersonate
 * Start impersonating a user (admin only)
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Only admins can impersonate
  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Only admins can impersonate users'
    })
  }

  const body = await readBody(event)
  const { userId } = body

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'userId is required'
    })
  }

  // Get the user to impersonate
  const targetUser = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  // Update session with impersonation data
  await setUserSession(event, {
    user: {
      ...session.user,
      // Store original admin info
      originalUserId: session.user.id,
      originalUserName: session.user.name,
      originalUserRole: session.user.role,
      // Set impersonated user info
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isImpersonating: true
    }
  })

  return {
    success: true,
    impersonating: {
      id: targetUser.id,
      name: targetUser.name,
      role: targetUser.role
    }
  }
})
