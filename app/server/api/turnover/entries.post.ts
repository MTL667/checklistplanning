import { z } from 'zod'
import prisma from '../../utils/prisma'

const saveTurnoverSchema = z.object({
  inspectorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0)
})

/**
 * POST /api/turnover/entries
 * Creates or updates a turnover entry
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Parse and validate body
  const body = await readBody(event)
  const result = saveTurnoverSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  const { inspectorId, date, amount } = result.data
  const entryDate = new Date(date)

  // Verify inspector exists and belongs to planner (unless admin)
  const inspector = await prisma.inspector.findUnique({
    where: { id: inspectorId }
  })

  if (!inspector) {
    throw createError({
      statusCode: 404,
      message: 'Inspector not found'
    })
  }

  if (session.user.role !== 'ADMIN' && inspector.plannerId !== session.user.id) {
    throw createError({
      statusCode: 403,
      message: 'Not authorized to edit this inspector'
    })
  }

  // Upsert the entry
  const entry = await prisma.turnoverEntry.upsert({
    where: {
      inspectorId_date: {
        inspectorId,
        date: entryDate
      }
    },
    update: {
      amount,
      plannerId: session.user.id
    },
    create: {
      inspectorId,
      plannerId: session.user.id,
      date: entryDate,
      amount
    },
    include: {
      inspector: { select: { name: true } },
      planner: { select: { name: true } }
    }
  })

  // Broadcast real-time update
  const broadcast = (globalThis as any).__ssebroadcast
  if (typeof broadcast === 'function') {
    broadcast('all', 'turnover:updated', {
      id: entry.id,
      inspectorId: entry.inspectorId,
      inspectorName: entry.inspector.name,
      plannerId: entry.plannerId,
      plannerName: entry.planner.name,
      date: entry.date.toISOString().split('T')[0],
      amount: Number(entry.amount)
    })
  }

  return {
    id: entry.id,
    inspectorId: entry.inspectorId,
    date: entry.date.toISOString().split('T')[0],
    amount: Number(entry.amount)
  }
})
