FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "node src/db/migrate.js up && node src/server.js"]
