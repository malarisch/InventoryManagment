# Multi-stage Dockerfile for InventoryManagment Next.js App
# Based on GitHub Actions setup and Next.js best practices

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on package-lock.json
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install dev dependencies for build
RUN npm ci --ignore-scripts

# Generate Prisma Client (needed for build)
RUN npx prisma generate

# Build Next.js app
# Environment variables for build (NEXT_PUBLIC_* only)
# Other secrets should be provided at runtime
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app and dependencies
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client (generated during build)
COPY --from=builder /app/lib/generated/prisma ./lib/generated/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start Next.js
CMD ["node", "server.js"]