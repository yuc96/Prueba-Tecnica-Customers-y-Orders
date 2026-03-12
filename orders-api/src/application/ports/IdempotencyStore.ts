export interface IdempotencyRecord {
  key: string;
  target_type: string;
  target_id: string;
  status: string;
  response_body: unknown;
  created_at: Date;
  expires_at: Date | null;
}

export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | null>;
  set(key: string, targetType: string, targetId: string, status: string, responseBody: unknown, expiresAt?: Date): Promise<void>;
}
