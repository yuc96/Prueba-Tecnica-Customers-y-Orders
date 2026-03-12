import type { ProductRepository } from "../ports/ProductRepository.js";
import type { Product, CreateProductInput } from "../../domain/entities/Product.js";
import { SkuAlreadyExistsError } from "../../domain/errors.js";

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const existing = await this.productRepository.getBySku(input.sku);
    if (existing) throw new SkuAlreadyExistsError(input.sku);
    return this.productRepository.create(input);
  }
}
