import type { CustomerRepository } from "../../application/ports/CustomerRepository.js";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerSearchParams,
  PaginatedCustomers,
} from "../../domain/entities/Customer.js";
import { getDb } from "../server/db.js";

interface CustomerRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    created_at: row.created_at,
    deleted_at: row.deleted_at,
  };
}

export class MysqlCustomerRepository implements CustomerRepository {
  async create(input: CreateCustomerInput): Promise<Customer> {
    const db = await getDb();
    const [result] = await db.execute(
      "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
      [input.name, input.email, input.phone ?? null]
    );
    const insertId = (result as { insertId: number }).insertId;
    const [rows] = await db.execute("SELECT * FROM customers WHERE id = ?", [insertId]);
    return rowToCustomer((rows as CustomerRow[])[0]);
  }

  async getById(id: number, includeDeleted = false): Promise<Customer | null> {
    const db = await getDb();
    const clause = includeDeleted ? "" : " AND deleted_at IS NULL";
    const [rows] = await db.execute(`SELECT * FROM customers WHERE id = ?${clause}`, [id]);
    const row = (rows as CustomerRow[])[0];
    return row ? rowToCustomer(row) : null;
  }

  async search(params: CustomerSearchParams, includeDeleted = false): Promise<PaginatedCustomers> {
    const db = await getDb();
    const limit = Math.min(params.limit ?? 20, 100);
    const limitPlusOne = limit + 1;
    const deletedClause = includeDeleted ? "" : " AND deleted_at IS NULL";
    const cursorClause = params.cursor ? " AND id > ?" : "";
    const searchClause =
      params.search && params.search.trim()
        ? " AND (name LIKE ? OR email LIKE ?)"
        : "";
    const searchPattern = `%${params.search?.trim() ?? ""}%`;
    const args: unknown[] = [];
    if (params.cursor) args.push(params.cursor);
    if (params.search?.trim()) args.push(searchPattern, searchPattern);

    const sql = `SELECT * FROM customers WHERE 1=1${deletedClause}${cursorClause}${searchClause} ORDER BY id ASC LIMIT ${limitPlusOne}`;
    const [rows] = await db.execute(sql, args);
    const list = (rows as CustomerRow[]).map(rowToCustomer);
    const hasMore = list.length > limit;
    const data = hasMore ? list.slice(0, limit) : list;
    const nextCursor = hasMore ? String(data[data.length - 1].id) : null;
    return { data, nextCursor, hasMore };
  }

  async update(id: number, input: UpdateCustomerInput): Promise<Customer | null> {
    const db = await getDb();
    const updates: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) {
      updates.push("name = ?");
      values.push(input.name);
    }
    if (input.email !== undefined) {
      updates.push("email = ?");
      values.push(input.email);
    }
    if (input.phone !== undefined) {
      updates.push("phone = ?");
      values.push(input.phone);
    }
    if (updates.length === 0) {
      const c = await this.getById(id);
      return c;
    }
    values.push(id);
    await db.execute(
      `UPDATE customers SET ${updates.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return this.getById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const db = await getDb();
    const [result] = await db.execute("UPDATE customers SET deleted_at = NOW() WHERE id = ?", [id]);
    return (result as { affectedRows: number }).affectedRows > 0;
  }
}
