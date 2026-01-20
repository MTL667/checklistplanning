import prisma from '../../utils/prisma'

/**
 * GET /api/checklist/entries
 * Returns checklist entries for the current user
 * Query params: ?date=YYYY-MM-DD
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const query = getQuery(event)

  // Default to today
  const dateStr = (query.date as string) || new Date().toISOString().split('T')[0]
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  // Get all active tasks
  const tasks = await prisma.taskType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  // Get entries for this user and date
  const entries = await prisma.checklistEntry.findMany({
    where: {
      plannerId: session.user.id,
      date
    }
  })

  // Create a map of completed tasks
  const completedMap = new Map(
    entries.map(e => [e.taskTypeId, e.completedAt])
  )

  return tasks.map(task => ({
    id: task.id,
    name: task.name,
    nameNl: task.nameNl,
    nameFr: task.nameFr,
    description: task.description,
    descriptionNl: task.descriptionNl,
    descriptionFr: task.descriptionFr,
    frequency: task.frequency,
    completed: completedMap.has(task.id),
    completedAt: completedMap.get(task.id) || null
  }))
})
