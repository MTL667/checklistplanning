import prisma from '../../utils/prisma'

/**
 * GET /api/users
 * Returns list of all users (admin only)
 */
export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await requireUserSession(event)

  // Check admin role
  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { inspectors: true }
      }
    }
  })

  return users.map(user => ({
    id: user.id,
    entraId: user.entraId,
    email: user.email,
    name: user.name,
    role: user.role,
    locale: user.locale,
    inspectorCount: user._count.inspectors,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }))
})
