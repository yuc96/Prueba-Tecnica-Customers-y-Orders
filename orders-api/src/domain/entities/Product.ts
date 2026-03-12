export interface Product {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
  stock: number;
  created_at: Date;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  price_cents: number;
  stock?: number;
}

export interface UpdateProductInput {
  name?: string;
  price_cents?: number;
  stock?: number;
}
