import { z } from 'zod'
import prisma from '../../utils/prisma'

const toggleTaskSchema = z.object({
  taskTypeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean()
})

/**
 * POST /api/checklist/entries
 * Toggles a checklist entry
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)
  const result = toggleTaskSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  const { taskTypeId, date, completed } = result.data
  const entryDate = new Date(date)
  entryDate.setHours(0, 0, 0, 0)

  // Verify task exists
  const task = await prisma.taskType.findUnique({
    where: { id: taskTypeId }
  })

  if (!task) {
    throw createError({
      statusCode: 404,
      message: 'Task not found'
    })
  }

  if (completed) {
    // Create or update entry
    const entry = await prisma.checklistEntry.upsert({
      where: {
        taskTypeId_plannerId_date: {
          taskTypeId,
          plannerId: session.user.id,
          date: entryDate
        }
      },
      update: {
        completedAt: new Date()
      },
      create: {
        taskTypeId,
        plannerId: session.user.id,
        date: entryDate,
        completedAt: new Date()
      }
    })

    return {
      taskTypeId,
      completed: true,
      completedAt: entry.completedAt
    }
  } else {
    // Delete entry
    await prisma.checklistEntry.deleteMany({
      where: {
        taskTypeId,
        plannerId: session.user.id,
        date: entryDate
      }
    })

    return {
      taskTypeId,
      completed: false,
      completedAt: null
    }
  }
})
