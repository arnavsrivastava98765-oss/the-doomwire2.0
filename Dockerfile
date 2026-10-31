FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

# 1. Build Frontend Static Bundle
COPY package*.json ./
RUN npm install
COPY index.html vite.config.js ./
COPY src/ ./src/
RUN npm run build

# 2. Setup Backend Engine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./

EXPOSE 5000

ENV PORT=5000
CMD ["node", "server.js"]
