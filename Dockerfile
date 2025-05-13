FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Set working directory
WORKDIR /app

# Copy package.json and related files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN pnpm run build

# Production image
FROM node:20-alpine

# Set working directory
WORKDIR /app


# Install pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Set command
CMD ["node", "dist/main.js"]