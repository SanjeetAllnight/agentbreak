FROM oven/bun:1 as build

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/
COPY server/package.json ./server/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend
WORKDIR /app/web
RUN bun run build

# Start the server
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/agentbreak.sqlite
VOLUME ["/data"]
EXPOSE 3000

CMD ["bun", "run", "index.ts"]
