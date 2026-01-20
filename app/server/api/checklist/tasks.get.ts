import prisma from '../../utils/prisma'

/**
 * GET /api/checklist/tasks
 * Returns all active task types
 */
export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const tasks = await prisma.taskType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  return tasks.map(task => ({
    id: task.id,
    name: task.name,
    nameNl: task.nameNl,
    nameFr: task.nameFr,
    description: task.description,
    descriptionNl: task.descriptionNl,
    descriptionFr: task.descriptionFr,
    frequency: task.frequency,
    sortOrder: task.sortOrder
  }))
})
