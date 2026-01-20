/**
 * GET /api/events/stream
 * Server-Sent Events endpoint for real-time updates
 */

// Event store for broadcasting
const clients = new Map<string, Set<(data: any) => void>>()

export function broadcast(channel: string, event: string, data: any) {
  const channelClients = clients.get(channel)
  if (channelClients) {
    const message = { event, data, timestamp: new Date().toISOString() }
    channelClients.forEach(send => {
      try {
        send(message)
      } catch (e) {
        console.error('Failed to send SSE message:', e)
      }
    })
  }
}

// Make broadcast available globally
;(globalThis as any).__ssebroadcast = broadcast

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Determine channel based on user role
  const channel = session.user.role === 'ADMIN' ? 'admin' : `planner:${session.user.id}`

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const response = event.node.res

  // Send function for this client
  const send = (data: any) => {
    response.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Register client
  if (!clients.has(channel)) {
    clients.set(channel, new Set())
  }
  clients.get(channel)!.add(send)

  // Also subscribe to 'all' channel for broadcasts
  if (!clients.has('all')) {
    clients.set('all', new Set())
  }
  clients.get('all')!.add(send)

  // Send initial connection event
  send({ event: 'connected', data: { channel, userId: session.user.id } })

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    try {
      response.write(`:heartbeat\n\n`)
    } catch (e) {
      clearInterval(heartbeatInterval)
    }
  }, 30000)

  // Clean up on close
  event.node.req.on('close', () => {
    clearInterval(heartbeatInterval)
    clients.get(channel)?.delete(send)
    clients.get('all')?.delete(send)

    // Clean up empty channels
    if (clients.get(channel)?.size === 0) {
      clients.delete(channel)
    }
    if (clients.get('all')?.size === 0) {
      clients.delete('all')
    }
  })

  // Keep the connection open
  return new Promise(() => {})
})
