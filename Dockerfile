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

# Increase Node.js memory limit for build (8GB)
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application with keepalive output to prevent idle timeout
RUN npm run build & \
    BUILD_PID=$! && \
    while kill -0 $BUILD_PID 2>/dev/null; do \
        echo "[keepalive] Build still running at $(date)" && \
        sleep 30; \
    done && \
    wait $BUILD_PID

# Stage 3: Production dependencies only
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
# Skip postinstall scripts - we only need runtime dependencies
RUN npm ci --omit=dev --prefer-offline --no-audit --ignore-scripts

# Stage 4: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Copy build output
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output

# Copy production dependencies (for externalized packages like xlsx)
COPY --from=prod-deps --chown=nuxtjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nuxtjs

# Expose port
EXPOSE 3000

# Start the application directly (no migrations - run separately)
CMD ["node", ".output/server/index.mjs"]
