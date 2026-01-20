interface SSEMessage {
  event: string
  data: any
  timestamp: string
}

type EventCallback = (data: any) => void

/**
 * Composable for real-time updates via SSE
 */
export function useRealtime() {
  const eventSource = ref<EventSource | null>(null)
  const isConnected = ref(false)
  const lastError = ref<string | null>(null)
  const listeners = new Map<string, Set<EventCallback>>()

  const connect = () => {
    if (eventSource.value) {
      return // Already connected
    }

    if (import.meta.server) {
      return // Don't run on server
    }

    try {
      eventSource.value = new EventSource('/api/events/stream')

      eventSource.value.onopen = () => {
        isConnected.value = true
        lastError.value = null
        console.log('[SSE] Connected')
      }

      eventSource.value.onmessage = (e) => {
        try {
          const message: SSEMessage = JSON.parse(e.data)
          const callbacks = listeners.get(message.event)
          if (callbacks) {
            callbacks.forEach(cb => cb(message.data))
          }

          // Also notify 'all' listeners
          const allCallbacks = listeners.get('*')
          if (allCallbacks) {
            allCallbacks.forEach(cb => cb(message))
          }
        } catch (err) {
          console.error('[SSE] Parse error:', err)
        }
      }

      eventSource.value.onerror = () => {
        isConnected.value = false
        lastError.value = 'Connection lost'
        console.error('[SSE] Connection error')

        // Reconnect after delay
        setTimeout(() => {
          eventSource.value?.close()
          eventSource.value = null
          connect()
        }, 5000)
      }
    } catch (err) {
      console.error('[SSE] Failed to connect:', err)
      lastError.value = 'Failed to connect'
    }
  }

  const disconnect = () => {
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
      isConnected.value = false
    }
  }

  const on = (event: string, callback: EventCallback) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      listeners.get(event)?.delete(callback)
    }
  }

  const off = (event: string, callback?: EventCallback) => {
    if (callback) {
      listeners.get(event)?.delete(callback)
    } else {
      listeners.delete(event)
    }
  }

  // Auto-connect on mount
  onMounted(() => {
    connect()
  })

  // Clean up on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    lastError: readonly(lastError),
    connect,
    disconnect,
    on,
    off
  }
}
