/**
 * Health check endpoint
 * GET /api/health
 *
 * Returns the current health status of the application
 */
export default defineEventHandler(async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
})
