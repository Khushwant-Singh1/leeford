# Stage 1: Base image with Node.js and pnpm
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app
# Copy only the files needed to install dependencies
COPY package.json pnpm-lock.yaml* ./
# Copy prisma schema to ensure the client is generated on install
COPY prisma ./prisma/
# Install all dependencies including devDependencies
RUN pnpm install --frozen-lockfile --config.auto-approve-builds=true

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app
# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
# Copy the rest of your application code
COPY . .
# Generate Prisma client
RUN pnpm prisma generate
# Build the Next.js application
RUN pnpm build

# Stage 4: Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy the static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy the public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Copy package.json for potential script reference
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Set the non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000

# The command to start the app is now the standalone server.js
CMD ["node", "server.js"]