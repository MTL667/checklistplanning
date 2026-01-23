# Planning Checklist Application Dockerfile
# Multi-stage build for production deployment

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install all dependencies (including dev for build)
RUN npm ci --prefer-offline --no-audit

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Set memory limit to match available resources (~1.5GB) and enable GC optimization
ENV NODE_OPTIONS="--max-old-space-size=1536 --expose-gc"

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application with keepalive output to prevent idle timeout
RUN npm run build & \
    BUILD_PID=$! && \
    while kill -0 $BUILD_PID 2>/dev/null; do \
        echo "[keepalive] Build in progress... $(date) - Memory: $(cat /proc/meminfo | grep MemAvailable | awk '{print $2}') kB available" && \
        sleep 15; \
    done && \
    wait $BUILD_PID

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Copy build output (everything is bundled, no node_modules needed)
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output

# Switch to non-root user
USER nuxtjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
