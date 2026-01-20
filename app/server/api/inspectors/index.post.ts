import { z } from 'zod'
import prisma from '../../utils/prisma'

const createInspectorSchema = z.object({
  name: z.string().min(1).max(100),
  plannerId: z.string().uuid().optional().nullable()
})

/**
 * POST /api/inspectors
 * Creates a new inspector (admin only)
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }

  // Check admin role
  if (session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  // Parse and validate body
  const body = await readBody(event)
  const result = createInspectorSchema.safeParse(body)

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

  // Create inspector
  const inspector = await prisma.inspector.create({
    data: {
      name: result.data.name,
      plannerId: result.data.plannerId || null
    },
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
    createdAt: inspector.createdAt
  }
})
