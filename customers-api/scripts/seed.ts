import { readFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";

async function seed() {
  const dbDir = process.env.DB_DIR || join(import.meta.dir, "../../db");
  const seedPath = join(dbDir, "seed.sql");
  const seedSql = readFileSync(seedPath, "utf-8");
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? "localhost",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE ?? "b2b_orders",
    multipleStatements: true,
  });
  const statements = seedSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  for (const stmt of statements) {
    if (stmt.toUpperCase().startsWith("USE ")) {
      await connection.query(stmt);
      continue;
    }
    await connection.query(stmt + ";");
  }
  await connection.end();
  console.log("Seed completed.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
