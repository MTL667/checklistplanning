import { z } from 'zod'
import prisma from '../../utils/prisma'

const createTaskSchema = z.object({
  nameNl: z.string().min(1).max(100),
  nameFr: z.string().min(1).max(100),
  descriptionNl: z.string().max(500).optional(),
  descriptionFr: z.string().max(500).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY']).default('DAILY'),
  sortOrder: z.number().int().min(0).default(0)
})

/**
 * POST /api/checklist/tasks
 * Creates a new task type (admin only)
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const body = await readBody(event)
  const result = createTaskSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  const task = await prisma.taskType.create({
    data: {
      name: result.data.nameNl, // Default name
      nameNl: result.data.nameNl,
      nameFr: result.data.nameFr,
      description: result.data.descriptionNl,
      descriptionNl: result.data.descriptionNl,
      descriptionFr: result.data.descriptionFr,
      frequency: result.data.frequency,
      sortOrder: result.data.sortOrder
    }
  })

  return {
    id: task.id,
    nameNl: task.nameNl,
    nameFr: task.nameFr,
    frequency: task.frequency,
    sortOrder: task.sortOrder
  }
})
