import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? "localhost",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE ?? "b2b_orders",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getDb() {
  return pool;
}

export async function queryDb<T = unknown>(sql: string, params: unknown[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
