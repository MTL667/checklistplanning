import { z } from 'zod'
import prisma from '../../utils/prisma'

const reassignSchema = z.object({
  absenceId: z.string().uuid(),
  inspectorId: z.string().uuid(),
  temporaryPlannerId: z.string().uuid()
})

/**
 * POST /api/absences/reassign
 * Reassigns an inspector to a temporary planner during absence
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
  const result = reassignSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  const { absenceId, inspectorId, temporaryPlannerId } = result.data

  // Verify absence exists
  const absence = await prisma.absenceRecord.findUnique({
    where: { id: absenceId }
  })

  if (!absence) {
    throw createError({
      statusCode: 404,
      message: 'Absence not found'
    })
  }

  // Verify inspector exists
  const inspector = await prisma.inspector.findUnique({
    where: { id: inspectorId }
  })

  if (!inspector) {
    throw createError({
      statusCode: 404,
      message: 'Inspector not found'
    })
  }

  // Verify temporary planner exists
  const tempPlanner = await prisma.user.findUnique({
    where: { id: temporaryPlannerId }
  })

  if (!tempPlanner) {
    throw createError({
      statusCode: 404,
      message: 'Temporary planner not found'
    })
  }

  // Upsert reassignment
  const reassignment = await prisma.inspectorReassignment.upsert({
    where: {
      absenceId_inspectorId: {
        absenceId,
        inspectorId
      }
    },
    update: {
      temporaryPlannerId
    },
    create: {
      absenceId,
      inspectorId,
      temporaryPlannerId
    },
    include: {
      inspector: {
        select: { name: true }
      },
      temporaryPlanner: {
        select: { name: true }
      }
    }
  })

  return {
    id: reassignment.id,
    inspectorId: reassignment.inspectorId,
    inspectorName: reassignment.inspector.name,
    temporaryPlannerId: reassignment.temporaryPlannerId,
    temporaryPlannerName: reassignment.temporaryPlanner.name
  }
})
