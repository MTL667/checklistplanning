import { z } from 'zod'
import prisma from '../../utils/prisma'

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'PLANNER']).optional(),
  locale: z.enum(['nl', 'fr']).optional()
})

/**
 * PATCH /api/users/:id
 * Updates a user's role or locale (admin only)
 */
export default defineEventHandler(async (event) => {
  // Check authentication
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
      message: 'User ID required'
    })
  }

  // Parse and validate body
  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  // Check user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  // Prevent removing last admin
  if (result.data.role === 'PLANNER' && existingUser.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    if (adminCount <= 1) {
      throw createError({
        statusCode: 400,
        message: 'Cannot remove the last admin'
      })
    }
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: result.data
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    locale: user.locale,
    updatedAt: user.updatedAt
  }
})
