FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p uploads/payment-proofs uploads/invoices

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:5000/health/live || exit 1

CMD ["node", "server.js"]
