import prisma from '../../utils/prisma'

/**
 * GET /api/turnover/entries
 * Returns turnover entries for the current week
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

  // Get inspectors with their entries for the date range
  const inspectors = await prisma.inspector.findMany({
    where: {
      ...inspectorWhere,
      isActive: true
    },
    orderBy: { name: 'asc' },
    include: {
      turnoverEntries: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      targets: {
        where: {
          OR: [
            { isDefault: true },
            {
              date: {
                gte: startDate,
                lte: endDate
              }
            }
          ]
        }
      }
    }
  })

  // Transform data for frontend
  return inspectors.map(inspector => {
    // Get default target
    const defaultTarget = inspector.targets.find(t => t.isDefault)

    // Create entries map by date
    const entriesByDate: Record<string, number> = {}
    inspector.turnoverEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0]
      entriesByDate[dateKey] = Number(entry.amount)
    })

    // Create targets map by date
    const targetsByDate: Record<string, number> = {}
    inspector.targets.forEach(target => {
      if (target.date) {
        const dateKey = target.date.toISOString().split('T')[0]
        targetsByDate[dateKey] = Number(target.amount)
      }
    })

    return {
      id: inspector.id,
      name: inspector.name,
      defaultTarget: defaultTarget ? Number(defaultTarget.amount) : 0,
      entries: entriesByDate,
      targets: targetsByDate
    }
  })
})
