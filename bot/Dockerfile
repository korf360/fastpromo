# Node 20 LTS for Railway / Nixpacks
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production

# Railway injects PORT at runtime
EXPOSE 3000

CMD ["npm", "start"]
