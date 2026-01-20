import prisma from '../../utils/prisma'

/**
 * GET /api/admin/planners-status
 * Returns detailed status for all planners
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get all planners with their stats
  const planners = await prisma.user.findMany({
    where: { role: 'PLANNER' },
    orderBy: { name: 'asc' },
    include: {
      inspectors: {
        where: { isActive: true },
        select: { id: true, name: true }
      },
      checklistEntries: {
        where: { date: today }
      },
      absences: {
        where: {
          startDate: { lte: today },
          endDate: { gte: today }
        }
      }
    }
  })

  // Get task count for completion calculation
  const taskCount = await prisma.taskType.count({ where: { isActive: true } })

  // Get today's turnover per planner
  const turnoverByPlanner = await prisma.turnoverEntry.groupBy({
    by: ['plannerId'],
    _sum: { amount: true },
    where: { date: today }
  })

  const turnoverMap = new Map(
    turnoverByPlanner.map(t => [t.plannerId, Number(t._sum.amount) || 0])
  )

  return planners.map(planner => ({
    id: planner.id,
    name: planner.name,
    email: planner.email,
    inspectorCount: planner.inspectors.length,
    inspectors: planner.inspectors,
    checklistProgress: {
      completed: planner.checklistEntries.length,
      total: taskCount,
      percentage: taskCount > 0 ? Math.round((planner.checklistEntries.length / taskCount) * 100) : 0
    },
    todayTurnover: turnoverMap.get(planner.id) || 0,
    isAbsent: planner.absences.length > 0,
    absence: planner.absences[0] ? {
      startDate: planner.absences[0].startDate.toISOString().split('T')[0],
      endDate: planner.absences[0].endDate.toISOString().split('T')[0],
      reason: planner.absences[0].reason
    } : null
  }))
})
