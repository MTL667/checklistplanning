import { z } from 'zod'
import prisma from '../../utils/prisma'

const setTargetSchema = z.object({
  inspectorId: z.string().uuid(),
  amount: z.number().min(0),
  isDefault: z.boolean().optional()
})

/**
 * POST /api/turnover/targets
 * Sets a turnover target for an inspector
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
  const result = setTargetSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  const { inspectorId, amount, isDefault } = result.data

  // If setting default target, update inspector directly
  if (isDefault) {
    const inspector = await prisma.inspector.update({
      where: { id: inspectorId },
      data: { defaultTarget: amount }
    })

    return {
      inspectorId: inspector.id,
      amount: Number(inspector.defaultTarget),
      isDefault: true
    }
  }

  // Otherwise, create/update a dated target
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = await prisma.turnoverTarget.upsert({
    where: {
      inspectorId_date: {
        inspectorId,
        date: today
      }
    },
    update: { amount },
    create: {
      inspectorId,
      date: today,
      amount,
      isDefault: false
    }
  })

  return {
    id: target.id,
    inspectorId: target.inspectorId,
    date: target.date?.toISOString().split('T')[0],
    amount: Number(target.amount),
    isDefault: target.isDefault
  }
})
