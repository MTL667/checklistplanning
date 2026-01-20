import prisma from '../../utils/prisma'

/**
 * GET /api/reports/weekly
 * Generates a detailed weekly report
 * Query params: ?startDate=YYYY-MM-DD
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const query = getQuery(event)

  // Calculate week bounds
  const now = new Date()
  let startDate: Date

  if (query.startDate) {
    startDate = new Date(query.startDate as string)
  } else {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - now.getDay() + 1) // Monday
  }
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6) // Sunday
  endDate.setHours(23, 59, 59, 999)

  // Build where clause based on role
  const inspectorWhere = session.user.role === 'ADMIN'
    ? {}
    : { plannerId: session.user.id }

  // Fetch all data in parallel
  const [inspectors, entries, targets, checklistEntries, taskTypes] = await Promise.all([
    // Inspectors
    prisma.inspector.findMany({
      where: { ...inspectorWhere, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        planner: { select: { id: true, name: true } }
      }
    }),

    // Turnover entries
    prisma.turnoverEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        inspector: inspectorWhere
      },
      include: {
        inspector: { select: { id: true, name: true } },
        planner: { select: { id: true, name: true } }
      }
    }),

    // Targets
    prisma.turnoverTarget.findMany({
      where: {
        inspector: inspectorWhere,
        isDefault: true
      }
    }),

    // Checklist entries (if admin, get all planners)
    prisma.checklistEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(session.user.role !== 'ADMIN' ? { plannerId: session.user.id } : {})
      },
      include: {
        taskType: { select: { id: true, nameNl: true, nameFr: true } },
        planner: { select: { id: true, name: true } }
      }
    }),

    // Task types
    prisma.taskType.findMany({
      where: { isActive: true }
    })
  ])

  // Generate week days
  const weekDays: string[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    weekDays.push(date.toISOString().split('T')[0])
  }

  // Create target map
  const targetMap = new Map(targets.map(t => [t.inspectorId, Number(t.amount)]))

  // Process inspector data
  const inspectorData = inspectors.map(inspector => {
    const dailyTarget = targetMap.get(inspector.id) || 0
    const weeklyTarget = dailyTarget * 5

    // Get entries for this inspector
    const inspectorEntries = entries.filter(e => e.inspectorId === inspector.id)

    // Create daily breakdown
    const daily: Record<string, number> = {}
    weekDays.forEach(day => {
      const entry = inspectorEntries.find(e => e.date.toISOString().split('T')[0] === day)
      daily[day] = entry ? Number(entry.amount) : 0
    })

    const weeklyTotal = Object.values(daily).reduce((sum, val) => sum + val, 0)
    const workDaysWithEntries = Object.entries(daily)
      .filter(([date]) => {
        const d = new Date(date)
        return d.getDay() >= 1 && d.getDay() <= 5 // Mon-Fri
      })
      .filter(([_, val]) => val > 0).length

    const successfulDays = Object.entries(daily)
      .filter(([date, val]) => {
        const d = new Date(date)
        return d.getDay() >= 1 && d.getDay() <= 5 && val >= dailyTarget
      }).length

    return {
      id: inspector.id,
      name: inspector.name,
      plannerName: inspector.planner?.name || 'Unassigned',
      dailyTarget,
      weeklyTarget,
      daily,
      weeklyTotal,
      average: workDaysWithEntries > 0 ? Math.round(weeklyTotal / workDaysWithEntries) : 0,
      successfulDays,
      performance: weeklyTarget > 0 ? Math.round((weeklyTotal / weeklyTarget) * 100) : 0
    }
  })

  // Calculate totals
  const totalTurnover = inspectorData.reduce((sum, i) => sum + i.weeklyTotal, 0)
  const totalTarget = inspectorData.reduce((sum, i) => sum + i.weeklyTarget, 0)

  // Daily totals
  const dailyTotals: Record<string, number> = {}
  weekDays.forEach(day => {
    dailyTotals[day] = inspectorData.reduce((sum, i) => sum + (i.daily[day] || 0), 0)
  })

  // Checklist completion by planner
  const plannerChecklist: Record<string, { completed: number; total: number; days: Record<string, number> }> = {}

  if (session.user.role === 'ADMIN') {
    // Get unique planners from entries
    const plannerIds = [...new Set(checklistEntries.map(e => e.plannerId))]
    plannerIds.forEach(plannerId => {
      const plannerEntries = checklistEntries.filter(e => e.plannerId === plannerId)
      const plannerName = plannerEntries[0]?.planner.name || 'Unknown'

      const days: Record<string, number> = {}
      weekDays.forEach(day => {
        days[day] = plannerEntries.filter(e => e.date.toISOString().split('T')[0] === day).length
      })

      plannerChecklist[plannerName] = {
        completed: plannerEntries.length,
        total: taskTypes.length * 5, // 5 work days
        days
      }
    })
  }

  return {
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      weekDays
    },
    summary: {
      totalTurnover,
      totalTarget,
      performance: totalTarget > 0 ? Math.round((totalTurnover / totalTarget) * 100) : 0,
      inspectorCount: inspectors.length,
      averagePerInspector: inspectors.length > 0 ? Math.round(totalTurnover / inspectors.length) : 0
    },
    dailyTotals,
    inspectors: inspectorData,
    checklist: plannerChecklist,
    generatedAt: new Date().toISOString()
  }
})
