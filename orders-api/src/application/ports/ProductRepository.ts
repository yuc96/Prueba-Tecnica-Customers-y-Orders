import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "../../domain/entities/Product.js";

export interface ProductSearchParams {
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedProducts {
  data: Product[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProductRepository {
  create(input: CreateProductInput): Promise<Product>;
  getById(id: number): Promise<Product | null>;
  getBySku(sku: string): Promise<Product | null>;
  search(params: ProductSearchParams): Promise<PaginatedProducts>;
  update(id: number, input: UpdateProductInput): Promise<Product | null>;
  getByIds(ids: number[]): Promise<Product[]>;
  reserveStock(productId: number, qty: number): Promise<boolean>;
  restoreStock(productId: number, qty: number): Promise<void>;
}
