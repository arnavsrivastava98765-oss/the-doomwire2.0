FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./

EXPOSE 5000

ENV PORT=5000
CMD ["node", "server.js"]
