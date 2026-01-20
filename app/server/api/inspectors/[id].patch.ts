import { z } from 'zod'
import prisma from '../../utils/prisma'

const updateInspectorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  plannerId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional()
})

/**
 * PATCH /api/inspectors/:id
 * Updates an inspector (admin only)
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

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Inspector ID required'
    })
  }

  // Parse and validate body
  const body = await readBody(event)
  const result = updateInspectorSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  // Check inspector exists
  const existingInspector = await prisma.inspector.findUnique({
    where: { id }
  })

  if (!existingInspector) {
    throw createError({
      statusCode: 404,
      message: 'Inspector not found'
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

  // Update inspector
  const inspector = await prisma.inspector.update({
    where: { id },
    data: result.data,
    include: {
      planner: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return {
    id: inspector.id,
    name: inspector.name,
    plannerId: inspector.plannerId,
    plannerName: inspector.planner?.name || null,
    isActive: inspector.isActive,
    updatedAt: inspector.updatedAt
  }
})
