import type { ProductRepository } from "../ports/ProductRepository.js";
import type { Product } from "../../domain/entities/Product.js";
import { ProductNotFoundError } from "../../domain/errors.js";

export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number): Promise<Product> {
    const product = await this.productRepository.getById(id);
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }
}
