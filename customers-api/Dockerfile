FROM oven/bun:1

WORKDIR /app

COPY customers-api/package.json customers-api/bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

COPY customers-api/ .
COPY db/ ./db/
EXPOSE 3001

ENV DB_DIR=/app/db
CMD ["sh", "-c", "bun run migrate && bun run seed && exec bun run start"]
