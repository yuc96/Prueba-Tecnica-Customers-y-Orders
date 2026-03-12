import type { ProductRepository } from "../ports/ProductRepository.js";
import type { Product, UpdateProductInput } from "../../domain/entities/Product.js";
import { ProductNotFoundError } from "../../domain/errors.js";

export class UpdateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number, input: UpdateProductInput): Promise<Product> {
    const existing = await this.productRepository.getById(id);
    if (!existing) throw new ProductNotFoundError(id);
    const updated = await this.productRepository.update(id, input);
    if (!updated) throw new ProductNotFoundError(id);
    return updated;
  }
}
