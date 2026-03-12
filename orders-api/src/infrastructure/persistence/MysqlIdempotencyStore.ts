import type { IdempotencyStore, IdempotencyRecord } from "../../application/ports/IdempotencyStore.js";
import { getDb } from "../server/db.js";

interface Row {
  key: string;
  target_type: string;
  target_id: string;
  status: string;
  response_body: string;
  created_at: Date;
  expires_at: Date | null;
}

export class MysqlIdempotencyStore implements IdempotencyStore {
  async get(key: string): Promise<IdempotencyRecord | null> {
    const db = await getDb();
    const [rows] = await db.execute(
      "SELECT * FROM idempotency_keys WHERE `key` = ? AND (expires_at IS NULL OR expires_at > NOW())",
      [key]
    );
    const row = (rows as Row[])[0];
    if (!row) return null;
    let response_body: unknown = null;
    try {
      response_body = row.response_body ? JSON.parse(row.response_body) : null;
    } catch {
      response_body = row.response_body;
    }
    return {
      key: row.key,
      target_type: row.target_type,
      target_id: row.target_id,
      status: row.status,
      response_body,
      created_at: row.created_at,
      expires_at: row.expires_at,
    };
  }

  async set(
    key: string,
    targetType: string,
    targetId: string,
    status: string,
    responseBody: unknown,
    expiresAt?: Date
  ): Promise<void> {
    const db = await getDb();
    const bodyStr = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
    await db.execute(
      `INSERT INTO idempotency_keys (\`key\`, target_type, target_id, status, response_body, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE target_type = VALUES(target_type), target_id = VALUES(target_id),
         status = VALUES(status), response_body = VALUES(response_body), expires_at = VALUES(expires_at)`,
      [key, targetType, targetId, status, bodyStr, expiresAt ?? null]
    );
  }
}
