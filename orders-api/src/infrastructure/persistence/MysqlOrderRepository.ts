import type { OrderRepository } from "../../application/ports/OrderRepository.js";
import type { Order, OrderItem } from "../../domain/entities/Order.js";
import type { OrderListParams, PaginatedOrders } from "../../domain/entities/Order.js";
import { getDb } from "../server/db.js";

interface OrderRow {
  id: number;
  customer_id: number;
  status: string;
  total_cents: number;
  created_at: Date;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  qty: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customer_id: row.customer_id,
    status: row.status as Order["status"],
    total_cents: row.total_cents,
    created_at: row.created_at,
  };
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    order_id: row.order_id,
    product_id: row.product_id,
    qty: row.qty,
    unit_price_cents: row.unit_price_cents,
    subtotal_cents: row.subtotal_cents,
  };
}

export class MysqlOrderRepository implements OrderRepository {
  async create(
    input: { customer_id: number; items: { product_id: number; qty: number }[] },
    items: { product_id: number; qty: number; unit_price_cents: number; subtotal_cents: number }[]
  ): Promise<Order> {
    const db = await getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const total_cents = items.reduce((s, i) => s + i.subtotal_cents, 0);
      const [orderResult] = await conn.execute(
        "INSERT INTO orders (customer_id, status, total_cents) VALUES (?, 'CREATED', ?)",
        [input.customer_id, total_cents]
      );
      const orderId = (orderResult as { insertId: number }).insertId;
      for (const item of items) {
        await conn.execute(
          "INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, subtotal_cents) VALUES (?, ?, ?, ?, ?)",
          [orderId, item.product_id, item.qty, item.unit_price_cents, item.subtotal_cents]
        );
        await conn.execute(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.qty, item.product_id]
        );
      }
      await conn.commit();
      const [rows] = await db.execute("SELECT * FROM orders WHERE id = ?", [orderId]);
      return rowToOrder((rows as OrderRow[])[0]);
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async getById(id: number): Promise<(Order & { items: OrderItem[] }) | null> {
    const db = await getDb();
    const [orderRows] = await db.execute("SELECT * FROM orders WHERE id = ?", [id]);
    const orderRow = (orderRows as OrderRow[])[0];
    if (!orderRow) return null;
    const [itemRows] = await db.execute("SELECT * FROM order_items WHERE order_id = ?", [id]);
    const items = (itemRows as OrderItemRow[]).map(rowToOrderItem);
    return { ...rowToOrder(orderRow), items };
  }

  async list(params: OrderListParams): Promise<PaginatedOrders> {
    const db = await getDb();
    const limit = Math.min(params.limit ?? 20, 100);
    const conditions: string[] = [];
    const args: unknown[] = [];
    if (params.status) {
      conditions.push("status = ?");
      args.push(params.status);
    }
    if (params.from) {
      conditions.push("created_at >= ?");
      args.push(params.from);
    }
    if (params.to) {
      conditions.push("created_at <= ?");
      args.push(params.to);
    }
    if (params.cursor) {
      conditions.push("id > ?");
      args.push(params.cursor);
    }
    const where = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
    const limitPlusOne = limit + 1;
    const [rows] = await db.execute(
      `SELECT * FROM orders${where} ORDER BY id ASC LIMIT ${limitPlusOne}`,
      args
    );
    const list = (rows as OrderRow[]).map(rowToOrder);
    const hasMore = list.length > limit;
    const data = hasMore ? list.slice(0, limit) : list;
    const nextCursor = hasMore ? String(data[data.length - 1].id) : null;
    return { data, nextCursor, hasMore };
  }

  async updateStatus(orderId: number, status: "CONFIRMED" | "CANCELED"): Promise<boolean> {
    const db = await getDb();
    const [result] = await db.execute("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      orderId,
    ]);
    return (result as { affectedRows: number }).affectedRows > 0;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const db = await getDb();
    const [rows] = await db.execute("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
    return (rows as OrderItemRow[]).map(rowToOrderItem);
  }
}
