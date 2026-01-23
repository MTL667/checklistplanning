import prisma from '../../utils/prisma'

/**
 * GET /api/inspectors
 * Returns list of inspectors
 * - Admin: sees all inspectors
 * - Planner: sees only their assigned inspectors
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    const where = session.user.role === 'ADMIN'
      ? {} // Admin sees all
      : { plannerId: session.user.id } // Planner sees their own

    const inspectors = await prisma.inspector.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        planner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return inspectors.map(inspector => ({
      id: inspector.id,
      name: inspector.name,
      plannerId: inspector.plannerId,
      plannerName: inspector.planner?.name || null,
      isActive: inspector.isActive,
      defaultTarget: Number(inspector.defaultTarget) || 0,
      createdAt: inspector.createdAt,
      updatedAt: inspector.updatedAt
    }))
  } catch (error: any) {
    console.error('GET /api/inspectors error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch inspectors'
    })
  }
})
