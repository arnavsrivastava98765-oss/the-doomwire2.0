FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

ENV PORT=5000
CMD ["node", "server.js"]
