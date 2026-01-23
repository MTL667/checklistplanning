import prisma from '../../utils/prisma'

/**
 * GET /api/reports/export
 * Exports weekly report as Excel file
 * Query params: ?startDate=YYYY-MM-DD&format=xlsx
 */
export default defineEventHandler(async (event) => {
  // Dynamic import to prevent bundling at build time
  const XLSX = await import('xlsx')
  
  const session = await requireUserSession(event)
  const query = getQuery(event)

  // Calculate week bounds
  const now = new Date()
  let startDate: Date

  if (query.startDate) {
    startDate = new Date(query.startDate as string)
  } else {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - now.getDay() + 1)
  }
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  // Build where clause based on role
  const inspectorWhere = session.user.role === 'ADMIN'
    ? {}
    : { plannerId: session.user.id }

  // Fetch data
  const [inspectors, entries, targets] = await Promise.all([
    prisma.inspector.findMany({
      where: { ...inspectorWhere, isActive: true },
      orderBy: { name: 'asc' },
      include: { planner: { select: { name: true } } }
    }),
    prisma.turnoverEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        inspector: inspectorWhere
      }
    }),
    prisma.turnoverTarget.findMany({
      where: { inspector: inspectorWhere, isDefault: true }
    })
  ])

  // Generate week days
  const weekDays: { date: string; label: string }[] = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    weekDays.push({
      date: date.toISOString().split('T')[0],
      label: `${dayNames[date.getDay()]} ${date.getDate()}`
    })
  }

  // Create target and entry maps
  const targetMap = new Map(targets.map(t => [t.inspectorId, Number(t.amount)]))
  const entryMap = new Map<string, number>()
  entries.forEach(e => {
    const key = `${e.inspectorId}_${e.date.toISOString().split('T')[0]}`
    entryMap.set(key, Number(e.amount))
  })

  // Build worksheet data
  const wsData: any[][] = []

  // Header row
  const headers = ['Inspector', 'Planner', ...weekDays.map(d => d.label), 'Total', 'Target', 'Performance']
  wsData.push(headers)

  // Data rows
  let grandTotal = 0
  let grandTarget = 0

  inspectors.forEach(inspector => {
    const dailyTarget = targetMap.get(inspector.id) || 0
    const weeklyTarget = dailyTarget * 5
    grandTarget += weeklyTarget

    const row: any[] = [
      inspector.name,
      inspector.planner?.name || 'Unassigned'
    ]

    let total = 0
    weekDays.forEach(day => {
      const key = `${inspector.id}_${day.date}`
      const value = entryMap.get(key) || 0
      row.push(value)
      total += value
    })

    grandTotal += total
    const performance = weeklyTarget > 0 ? Math.round((total / weeklyTarget) * 100) : 0

    row.push(total)
    row.push(weeklyTarget)
    row.push(`${performance}%`)

    wsData.push(row)
  })

  // Totals row
  const totalsRow: any[] = ['TOTAL', '']
  weekDays.forEach(day => {
    let dayTotal = 0
    inspectors.forEach(inspector => {
      const key = `${inspector.id}_${day.date}`
      dayTotal += entryMap.get(key) || 0
    })
    totalsRow.push(dayTotal)
  })
  totalsRow.push(grandTotal)
  totalsRow.push(grandTarget)
  totalsRow.push(`${grandTarget > 0 ? Math.round((grandTotal / grandTarget) * 100) : 0}%`)
  wsData.push(totalsRow)

  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Inspector
    { wch: 15 }, // Planner
    ...weekDays.map(() => ({ wch: 10 })),
    { wch: 10 }, // Total
    { wch: 10 }, // Target
    { wch: 12 }  // Performance
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report')

  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // Set response headers
  const filename = `turnover-report-${startDate.toISOString().split('T')[0]}.xlsx`

  setResponseHeaders(event, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length.toString()
  })

  return buffer
})
