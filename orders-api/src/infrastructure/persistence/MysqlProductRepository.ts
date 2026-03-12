import type {
  ProductRepository,
  ProductSearchParams,
  PaginatedProducts,
} from "../../application/ports/ProductRepository.js";
import type { Product, CreateProductInput, UpdateProductInput } from "../../domain/entities/Product.js";
import { getDb } from "../server/db.js";

interface ProductRow {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
  stock: number;
  created_at: Date;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price_cents: row.price_cents,
    stock: row.stock,
    created_at: row.created_at,
  };
}

export class MysqlProductRepository implements ProductRepository {
  async create(input: CreateProductInput): Promise<Product> {
    const db = await getDb();
    const [result] = await db.execute(
      "INSERT INTO products (sku, name, price_cents, stock) VALUES (?, ?, ?, ?)",
      [input.sku, input.name, input.price_cents, input.stock ?? 0]
    );
    const insertId = (result as { insertId: number }).insertId;
    const [rows] = await db.execute("SELECT * FROM products WHERE id = ?", [insertId]);
    return rowToProduct((rows as ProductRow[])[0]);
  }

  async getById(id: number): Promise<Product | null> {
    const db = await getDb();
    const [rows] = await db.execute("SELECT * FROM products WHERE id = ?", [id]);
    const row = (rows as ProductRow[])[0];
    return row ? rowToProduct(row) : null;
  }

  async getBySku(sku: string): Promise<Product | null> {
    const db = await getDb();
    const [rows] = await db.execute("SELECT * FROM products WHERE sku = ?", [sku.trim()]);
    const row = (rows as ProductRow[])[0];
    return row ? rowToProduct(row) : null;
  }

  async search(params: ProductSearchParams): Promise<PaginatedProducts> {
    const db = await getDb();
    const limit = Math.min(params.limit ?? 20, 100);
    const cursorClause = params.cursor ? " AND id > ?" : "";
    const searchClause =
      params.search && params.search.trim() ? " AND (name LIKE ? OR sku LIKE ?)" : "";
    const searchPattern = `%${params.search?.trim() ?? ""}%`;
    const args: (string | number)[] = [];
    if (params.cursor) args.push(Number(params.cursor));
    if (params.search?.trim()) args.push(searchPattern, searchPattern);
    const limitPlusOne = limit + 1;
    const sql = `SELECT * FROM products WHERE 1=1${cursorClause}${searchClause} ORDER BY id ASC LIMIT ${limitPlusOne}`;
    const [rows] = await db.execute(sql, args);
    const list = (rows as ProductRow[]).map(rowToProduct);
    const hasMore = list.length > limit;
    const data = hasMore ? list.slice(0, limit) : list;
    const nextCursor = hasMore ? String(data[data.length - 1].id) : null;
    return { data, nextCursor, hasMore };
  }

  async update(id: number, input: UpdateProductInput): Promise<Product | null> {
    const db = await getDb();
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (input.name !== undefined) {
      updates.push("name = ?");
      values.push(input.name);
    }
    if (input.price_cents !== undefined) {
      updates.push("price_cents = ?");
      values.push(input.price_cents);
    }
    if (input.stock !== undefined) {
      updates.push("stock = ?");
      values.push(input.stock);
    }
    if (updates.length === 0) return this.getById(id);
    values.push(id);
    await db.execute(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, values);
    return this.getById(id);
  }

  async getByIds(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const db = await getDb();
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await db.execute(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
    return (rows as ProductRow[]).map(rowToProduct);
  }

  async reserveStock(productId: number, qty: number): Promise<boolean> {
    const db = await getDb();
    const [result] = await db.execute(
      "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
      [qty, productId, qty]
    );
    return (result as { affectedRows: number }).affectedRows > 0;
  }

  async restoreStock(productId: number, qty: number): Promise<void> {
    const db = await getDb();
    await db.execute("UPDATE products SET stock = stock + ? WHERE id = ?", [qty, productId]);
  }
}
