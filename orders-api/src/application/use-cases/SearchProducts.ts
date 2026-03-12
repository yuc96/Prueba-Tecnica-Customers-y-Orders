import type { ProductRepository, ProductSearchParams, PaginatedProducts } from "../ports/ProductRepository.js";

export class SearchProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(params: ProductSearchParams): Promise<PaginatedProducts> {
    return this.productRepository.search(params);
  }
}
