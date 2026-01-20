import { z } from 'zod'
import prisma from '../../utils/prisma'

const bulkAssignSchema = z.object({
  inspectorIds: z.array(z.string().uuid()),
  plannerId: z.string().uuid().nullable()
})

/**
 * POST /api/inspectors/assign
 * Bulk assign inspectors to a planner (admin only)
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Check admin role
  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  // Parse and validate body
  const body = await readBody(event)
  const result = bulkAssignSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  // Verify planner exists if specified
  if (result.data.plannerId) {
    const planner = await prisma.user.findUnique({
      where: { id: result.data.plannerId }
    })

    if (!planner) {
      throw createError({
        statusCode: 400,
        message: 'Specified planner not found'
      })
    }
  }

  // Update all specified inspectors
  const updateResult = await prisma.inspector.updateMany({
    where: {
      id: { in: result.data.inspectorIds }
    },
    data: {
      plannerId: result.data.plannerId
    }
  })

  return {
    success: true,
    updatedCount: updateResult.count
  }
})
