import prisma from '../../utils/prisma'

/**
 * GET /api/inspectors
 * Returns list of inspectors
 * - Admin: sees all inspectors
 * - Planner: sees only their assigned inspectors
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const where = session.user.role === 'ADMIN'
    ? {} // Admin sees all
    : { plannerId: session.user.id } // Planner sees their own

  const inspectors = await prisma.inspector.findMany({
    where,
    orderBy: { name: 'asc' },
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
    createdAt: inspector.createdAt,
    updatedAt: inspector.updatedAt
  }))
})
