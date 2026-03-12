FROM oven/bun:1

WORKDIR /app

COPY orders-api/package.json orders-api/bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

COPY orders-api/ .
COPY db/ ./db/
EXPOSE 3002

ENV DB_DIR=/app/db
CMD ["sh", "-c", "bun run migrate && bun run seed && exec bun run start"]
