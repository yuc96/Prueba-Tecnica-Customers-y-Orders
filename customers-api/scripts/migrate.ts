import { readFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";

const maxRetries = 30;
const retryDelayMs = 1000;

async function connectWithRetry() {
  const opts = {
    host: process.env.MYSQL_HOST ?? "localhost",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE ?? "b2b_orders",
    multipleStatements: true,
  };
  for (let i = 0; i < maxRetries; i++) {
    try {
      const connection = await mysql.createConnection(opts);
      return connection;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      console.warn(`MySQL not ready (attempt ${i + 1}/${maxRetries}), retrying...`);
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  throw new Error("Could not connect to MySQL");
}

async function migrate() {
  const dbDir = process.env.DB_DIR || join(import.meta.dir, "../../db");
  const schemaPath = join(dbDir, "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  const connection = await connectWithRetry();
  try {
    await connection.query(schema);
    console.log("Migration completed.");
  } finally {
    await connection.end();
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
