import type { OrdersApiPort } from "../application/ports/OrdersApiPort.js";
import type { OrderDto } from "../domain/dto.js";

const BASE = process.env.ORDERS_API_BASE ?? "http://localhost:3002";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "";

export class HttpOrdersApiAdapter implements OrdersApiPort {
  async createOrder(
    customerId: number,
    items: { product_id: number; qty: number }[]
  ): Promise<OrderDto> {
    const res = await fetch(`${BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, items }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Orders API create: ${res.status} ${text}`);
    }
    const data = (await res.json()) as OrderDto & { customer_id?: number; created_at?: string };
    return {
      id: data.id,
      status: data.status,
      total_cents: data.total_cents,
      items: data.items ?? [],
    };
  }

  async confirmOrder(orderId: number, idempotencyKey: string): Promise<OrderDto> {
    const res = await fetch(`${BASE}/orders/${orderId}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Orders API confirm: ${res.status} ${text}`);
    }
    const data = (await res.json()) as OrderDto & { customer_id?: number; created_at?: string };
    return {
      id: data.id,
      status: data.status,
      total_cents: data.total_cents,
      items: data.items ?? [],
    };
  }
}
