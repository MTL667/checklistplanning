import { z } from 'zod'
import prisma from '../../utils/prisma'

// Valid status codes that users can enter
const STATUS_CODE_MAP: Record<string, string> = {
  'Z': 'SICK',
  'OG': 'TRAINING_GIVE',
  'OV': 'TRAINING_TAKE',
  'V': 'LEAVE'
}

const saveTurnoverSchema = z.object({
  inspectorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.union([
    z.number().min(0),
    z.string()
  ])
})

/**
 * POST /api/turnover/entries
 * Creates or updates a turnover entry
 * Accepts either a numeric amount or a status code (Z, OG, OV, V)
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Parse and validate body
  const body = await readBody(event)

  // Support both old 'amount' field and new 'value' field
  if (body.amount !== undefined && body.value === undefined) {
    body.value = body.amount
  }

  const result = saveTurnoverSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten()
    })
  }

  const { inspectorId, date, value } = result.data
  const entryDate = new Date(date)

  // Determine if value is a status code or numeric amount
  let amount = 0
  let statusCode: string | null = null

  if (typeof value === 'string') {
    const upperValue = value.toUpperCase().trim()
    if (STATUS_CODE_MAP[upperValue]) {
      statusCode = STATUS_CODE_MAP[upperValue]
      amount = 0
    } else {
      // Try to parse as number
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        amount = parsed
      } else {
        throw createError({
          statusCode: 400,
          message: `Invalid value: ${value}. Use a number or status code (Z, OG, OV, V)`
        })
      }
    }
  } else {
    amount = value
  }

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
      statusCode: statusCode as any,
      plannerId: session.user.id
    },
    create: {
      inspectorId,
      plannerId: session.user.id,
      date: entryDate,
      amount,
      statusCode: statusCode as any
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
      amount: Number(entry.amount),
      statusCode: entry.statusCode
    })
  }

  return {
    id: entry.id,
    inspectorId: entry.inspectorId,
    date: entry.date.toISOString().split('T')[0],
    amount: Number(entry.amount),
    statusCode: entry.statusCode
  }
})
