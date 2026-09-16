# APNILEAP Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5001

# Run Prisma db push & start Express server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start"]
