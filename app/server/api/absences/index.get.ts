import prisma from '../../utils/prisma'

/**
 * GET /api/absences
 * Returns all absence records
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const query = getQuery(event)
  const activeOnly = query.active === 'true'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where = activeOnly
    ? {
        startDate: { lte: today },
        endDate: { gte: today }
      }
    : {}

  const absences = await prisma.absenceRecord.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: {
      planner: {
        select: {
          id: true,
          name: true,
          email: true,
          inspectors: {
            where: { isActive: true },
            select: { id: true, name: true }
          }
        }
      },
      reassignments: {
        include: {
          inspector: {
            select: { id: true, name: true }
          },
          temporaryPlanner: {
            select: { id: true, name: true }
          }
        }
      }
    }
  })

  return absences.map(absence => ({
    id: absence.id,
    plannerId: absence.plannerId,
    plannerName: absence.planner.name,
    plannerEmail: absence.planner.email,
    startDate: absence.startDate.toISOString().split('T')[0],
    endDate: absence.endDate.toISOString().split('T')[0],
    reason: absence.reason,
    inspectors: absence.planner.inspectors,
    reassignments: absence.reassignments.map(r => ({
      id: r.id,
      inspectorId: r.inspectorId,
      inspectorName: r.inspector.name,
      temporaryPlannerId: r.temporaryPlannerId,
      temporaryPlannerName: r.temporaryPlanner.name
    })),
    isActive: absence.startDate <= today && absence.endDate >= today
  }))
})
