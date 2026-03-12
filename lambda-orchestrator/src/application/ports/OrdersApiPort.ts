import type { OrderDto } from "../../domain/dto.js";

export interface OrdersApiPort {
  createOrder(customerId: number, items: { product_id: number; qty: number }[]): Promise<OrderDto>;
  confirmOrder(orderId: number, idempotencyKey: string): Promise<OrderDto>;
}
