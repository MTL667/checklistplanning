import prisma from '../../utils/prisma'

/**
 * DELETE /api/absences/:id
 * Deletes an absence record and its reassignments
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
      message: 'Absence ID required'
    })
  }

  const absence = await prisma.absenceRecord.findUnique({
    where: { id }
  })

  if (!absence) {
    throw createError({
      statusCode: 404,
      message: 'Absence not found'
    })
  }

  // Delete reassignments first
  await prisma.inspectorReassignment.deleteMany({
    where: { absenceId: id }
  })

  // Delete absence
  await prisma.absenceRecord.delete({
    where: { id }
  })

  return { success: true }
})
