# --- Builder Stage ---
FROM node:22 AS builder
WORKDIR /app

COPY . .


RUN npm install

RUN npm run build -ws --if-present

RUN npm prune --production

# --- Runtime Stage ---
FROM node:22-slim
WORKDIR /app

COPY --from=builder /app .

WORKDIR /app/wallet-listener

CMD ["npm", "start"]
