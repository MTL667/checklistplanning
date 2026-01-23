import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  const body = await readBody(event)
  const { inspectorIds } = body

  if (!Array.isArray(inspectorIds)) {
    throw createError({
      statusCode: 400,
      message: 'inspectorIds must be an array'
    })
  }

  // Update sort order for each inspector
  const updates = inspectorIds.map((id: string, index: number) =>
    prisma.inspector.updateMany({
      where: {
        id,
        plannerId: user.id // Only allow reordering own inspectors
      },
      data: {
        sortOrder: index
      }
    })
  )

  await prisma.$transaction(updates)

  return { success: true }
})
