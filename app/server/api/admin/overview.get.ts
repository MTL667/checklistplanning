import prisma from '../../utils/prisma'

/**
 * GET /api/admin/overview
 * Returns aggregated admin dashboard data
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  // Get today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get current week bounds
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday

  // Parallel queries for performance
  const [
    userStats,
    inspectorStats,
    todayTurnover,
    weeklyTurnover,
    todayChecklist,
    activeAbsences,
    recentActivity
  ] = await Promise.all([
    // User stats
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    }),

    // Inspector stats
    prisma.inspector.aggregate({
      _count: true,
      where: { isActive: true }
    }),

    // Today's turnover
    prisma.turnoverEntry.aggregate({
      _sum: { amount: true },
      where: {
        date: today
      }
    }),

    // Weekly turnover
    prisma.turnoverEntry.aggregate({
      _sum: { amount: true },
      where: {
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    }),

    // Today's checklist completion
    prisma.checklistEntry.findMany({
      where: {
        date: today
      },
      include: {
        planner: {
          select: { id: true, name: true }
        }
      }
    }),

    // Active absences
    prisma.absenceRecord.findMany({
      where: {
        startDate: { lte: today },
        endDate: { gte: today }
      },
      include: {
        planner: {
          select: { id: true, name: true }
        }
      }
    }),

    // Recent turnover entries (last 24 hours)
    prisma.turnoverEntry.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        inspector: {
          select: { name: true }
        },
        planner: {
          select: { name: true }
        }
      }
    })
  ])

  // Calculate planner checklist completion rates
  const taskTypes = await prisma.taskType.count({ where: { isActive: true } })
  const plannerCompletionMap = new Map<string, { completed: number; name: string }>()

  todayChecklist.forEach(entry => {
    const current = plannerCompletionMap.get(entry.plannerId) || {
      completed: 0,
      name: entry.planner.name
    }
    current.completed += 1
    plannerCompletionMap.set(entry.plannerId, current)
  })

  const plannerCompletion = Array.from(plannerCompletionMap.entries()).map(([id, data]) => ({
    plannerId: id,
    plannerName: data.name,
    completed: data.completed,
    total: taskTypes,
    percentage: taskTypes > 0 ? Math.round((data.completed / taskTypes) * 100) : 0
  }))

  // Format user stats
  const adminCount = userStats.find(s => s.role === 'ADMIN')?._count || 0
  const plannerCount = userStats.find(s => s.role === 'PLANNER')?._count || 0

  return {
    users: {
      total: adminCount + plannerCount,
      admins: adminCount,
      planners: plannerCount
    },
    inspectors: {
      total: inspectorStats._count,
      active: inspectorStats._count
    },
    turnover: {
      today: Number(todayTurnover._sum.amount) || 0,
      weekly: Number(weeklyTurnover._sum.amount) || 0
    },
    checklist: {
      plannerCompletion,
      totalTasks: taskTypes
    },
    absences: {
      active: activeAbsences.length,
      list: activeAbsences.map(a => ({
        id: a.id,
        plannerId: a.plannerId,
        plannerName: a.planner.name,
        startDate: a.startDate.toISOString().split('T')[0],
        endDate: a.endDate.toISOString().split('T')[0],
        reason: a.reason
      }))
    },
    recentActivity: recentActivity.map(entry => ({
      id: entry.id,
      inspectorName: entry.inspector.name,
      plannerName: entry.planner.name,
      amount: Number(entry.amount),
      date: entry.date.toISOString().split('T')[0],
      updatedAt: entry.updatedAt.toISOString()
    }))
  }
})
