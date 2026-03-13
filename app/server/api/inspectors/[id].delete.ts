import prisma from '../../utils/prisma'

/**
 * DELETE /api/inspectors/:id
 * Deletes an inspector (admin only)
 * Will fail if the inspector has turnover entries to preserve historical data
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

  // Check inspector exists
  const inspector = await prisma.inspector.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          turnoverEntries: true
        }
      }
    }
  })

  if (!inspector) {
    throw createError({
      statusCode: 404,
      message: 'Inspector not found'
    })
  }

  // Prevent deletion if inspector has turnover entries (preserve historical data)
  if (inspector._count.turnoverEntries > 0) {
    throw createError({
      statusCode: 409,
      message: 'Cannot delete inspector with existing turnover entries. Consider deactivating instead.'
    })
  }

  // Delete related data first (targets, reassignments)
  await prisma.$transaction([
    prisma.turnoverTarget.deleteMany({
      where: { inspectorId: id }
    }),
    prisma.inspectorReassignment.deleteMany({
      where: { inspectorId: id }
    }),
    prisma.inspector.delete({
      where: { id }
    })
  ])

  return {
    success: true,
    message: 'Inspector deleted successfully'
  }
})
