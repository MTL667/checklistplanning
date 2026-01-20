import { z } from 'zod'
import prisma from '../../utils/prisma'

const createAbsenceSchema = z.object({
  plannerId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(255).optional()
})

/**
 * POST /api/absences
 * Creates an absence record
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
  const result = createAbsenceSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  // Verify planner exists
  const planner = await prisma.user.findUnique({
    where: { id: result.data.plannerId }
  })

  if (!planner) {
    throw createError({
      statusCode: 404,
      message: 'Planner not found'
    })
  }

  const startDate = new Date(result.data.startDate)
  const endDate = new Date(result.data.endDate)

  if (endDate < startDate) {
    throw createError({
      statusCode: 400,
      message: 'End date must be after start date'
    })
  }

  const absence = await prisma.absenceRecord.create({
    data: {
      plannerId: result.data.plannerId,
      startDate,
      endDate,
      reason: result.data.reason
    },
    include: {
      planner: {
        select: { name: true }
      }
    }
  })

  return {
    id: absence.id,
    plannerId: absence.plannerId,
    plannerName: absence.planner.name,
    startDate: absence.startDate.toISOString().split('T')[0],
    endDate: absence.endDate.toISOString().split('T')[0],
    reason: absence.reason
  }
})
