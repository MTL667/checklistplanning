import { z } from 'zod'
import prisma from '../../../utils/prisma'

const updateTaskSchema = z.object({
  nameNl: z.string().min(1).max(100).optional(),
  nameFr: z.string().min(1).max(100).optional(),
  descriptionNl: z.string().max(500).optional().nullable(),
  descriptionFr: z.string().max(500).optional().nullable(),
  frequency: z.enum(['DAILY', 'WEEKLY']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
})

/**
 * PATCH /api/checklist/tasks/:id
 * Updates a task type (admin only)
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Task ID required'
    })
  }

  const body = await readBody(event)
  const result = updateTaskSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  const existingTask = await prisma.taskType.findUnique({
    where: { id }
  })

  if (!existingTask) {
    throw createError({
      statusCode: 404,
      message: 'Task not found'
    })
  }

  const updateData: any = { ...result.data }
  if (result.data.nameNl) {
    updateData.name = result.data.nameNl
  }
  if (result.data.descriptionNl !== undefined) {
    updateData.description = result.data.descriptionNl
  }

  const task = await prisma.taskType.update({
    where: { id },
    data: updateData
  })

  return {
    id: task.id,
    nameNl: task.nameNl,
    nameFr: task.nameFr,
    descriptionNl: task.descriptionNl,
    descriptionFr: task.descriptionFr,
    frequency: task.frequency,
    sortOrder: task.sortOrder,
    isActive: task.isActive
  }
})
