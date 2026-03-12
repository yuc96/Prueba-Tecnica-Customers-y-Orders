export interface CreateAndConfirmOrderRequest {
  customer_id: number;
  items: { product_id: number; qty: number }[];
  idempotency_key: string;
  correlation_id?: string;
}

export interface CustomerDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface OrderItemDto {
  product_id: number;
  qty: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface OrderDto {
  id: number;
  status: string;
  total_cents: number;
  items: OrderItemDto[];
}

export interface CreateAndConfirmOrderResponse {
  success: true;
  correlationId: string | undefined;
  data: {
    customer: CustomerDto;
    order: OrderDto;
  };
}
