# Multi-stage production build for minimal attack surface & non-root security
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src/ ./src/
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS runtime
WORKDIR /app

# Setup production backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# Copy built frontend static dist into backend dist path
COPY --from=frontend-builder /app/dist /app/dist

# Secure Non-Root Execution
RUN chown -R pwuser:pwuser /app
USER pwuser

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
