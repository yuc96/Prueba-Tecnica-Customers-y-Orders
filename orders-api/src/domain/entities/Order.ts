export type OrderStatus = "CREATED" | "CONFIRMED" | "CANCELED";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  qty: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface Order {
  id: number;
  customer_id: number;
  status: OrderStatus;
  total_cents: number;
  created_at: Date;
  items?: OrderItem[];
}

export interface CreateOrderInput {
  customer_id: number;
  items: { product_id: number; qty: number }[];
}

export interface OrderListParams {
  status?: OrderStatus;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedOrders {
  data: Order[];
  nextCursor: string | null;
  hasMore: boolean;
}
