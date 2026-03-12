import type {
  Order,
  OrderItem,
  CreateOrderInput,
  OrderListParams,
  PaginatedOrders,
} from "../../domain/entities/Order.js";

export interface OrderRepository {
  create(input: CreateOrderInput, items: { product_id: number; qty: number; unit_price_cents: number; subtotal_cents: number }[]): Promise<Order>;
  getById(id: number): Promise<(Order & { items: OrderItem[] }) | null>;
  list(params: OrderListParams): Promise<PaginatedOrders>;
  updateStatus(orderId: number, status: "CONFIRMED" | "CANCELED"): Promise<boolean>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
}
