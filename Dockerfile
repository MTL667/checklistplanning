# Planning Checklist Application Dockerfile
# Multi-stage build for production deployment

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install all dependencies (including dev for build)
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copy built application and necessary files
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Set ownership
RUN chown -R nuxtjs:nodejs /app

# Switch to non-root user
USER nuxtjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]
