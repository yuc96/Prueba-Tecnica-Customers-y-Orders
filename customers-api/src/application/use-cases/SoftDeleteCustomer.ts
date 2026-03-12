import type { CustomerRepository } from "../ports/CustomerRepository.js";
import { CustomerNotFoundError } from "../../domain/errors.js";

export class SoftDeleteCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.customerRepository.getById(id);
    if (!existing) {
      throw new CustomerNotFoundError(id);
    }
    await this.customerRepository.softDelete(id);
  }
}
