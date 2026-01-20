import prisma from '../../utils/prisma'

/**
 * GET /api/turnover/summary
 * Returns turnover summary with calculations
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const query = getQuery(event)

  // Parse date range (default to current week)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
  endOfWeek.setHours(23, 59, 59, 999)

  const startDate = query.startDate
    ? new Date(query.startDate as string)
    : startOfWeek
  const endDate = query.endDate
    ? new Date(query.endDate as string)
    : endOfWeek

  // Build where clause based on role
  const inspectorWhere = session.user.role === 'ADMIN'
    ? {}
    : { plannerId: session.user.id }

  // Get all entries for the period
  const entries = await prisma.turnoverEntry.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      },
      inspector: inspectorWhere
    },
    include: {
      inspector: {
        include: {
          targets: {
            where: { isDefault: true }
          }
        }
      }
    }
  })

  // Get inspector count
  const inspectorCount = await prisma.inspector.count({
    where: {
      ...inspectorWhere,
      isActive: true
    }
  })

  // Calculate totals
  const weeklyTotal = entries.reduce((sum, e) => sum + Number(e.amount), 0)

  // Calculate daily totals
  const dailyTotals: Record<string, number> = {}
  entries.forEach(entry => {
    const dateKey = entry.date.toISOString().split('T')[0]
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(entry.amount)
  })

  // Calculate inspector averages
  const inspectorTotals: Record<string, { total: number; count: number; target: number }> = {}
  entries.forEach(entry => {
    if (!inspectorTotals[entry.inspectorId]) {
      const defaultTarget = entry.inspector.targets[0]
      inspectorTotals[entry.inspectorId] = {
        total: 0,
        count: 0,
        target: defaultTarget ? Number(defaultTarget.amount) : 0
      }
    }
    inspectorTotals[entry.inspectorId].total += Number(entry.amount)
    inspectorTotals[entry.inspectorId].count += 1
  })

  // Calculate successful days (days where total >= target)
  let successfulDays = 0
  const workDays = 5 // Monday to Friday
  Object.entries(dailyTotals).forEach(([date, total]) => {
    const dayDate = new Date(date)
    const dayOfWeek = dayDate.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday
      // Sum up all targets for that day
      const dailyTarget = Object.values(inspectorTotals).reduce((sum, i) => sum + i.target, 0)
      if (total >= dailyTarget) {
        successfulDays++
      }
    }
  })

  // Calculate average per inspector
  const inspectorAverage = inspectorCount > 0
    ? weeklyTotal / inspectorCount
    : 0

  return {
    weeklyTotal,
    dailyTotals,
    inspectorAverage: Math.round(inspectorAverage * 100) / 100,
    successfulDays,
    totalDays: workDays,
    inspectorCount,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
})
