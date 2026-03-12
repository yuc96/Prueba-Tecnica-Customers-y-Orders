import type { CustomerRepository } from "../ports/CustomerRepository.js";
import type { Customer, UpdateCustomerInput } from "../../domain/entities/Customer.js";
import { CustomerNotFoundError, EmailAlreadyExistsError } from "../../domain/errors.js";

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(id: number, input: UpdateCustomerInput): Promise<Customer> {
    const existing = await this.customerRepository.getById(id);
    if (!existing) {
      throw new CustomerNotFoundError(id);
    }
    if (input.email !== undefined) {
      const byEmail = await this.customerRepository.search({ search: input.email, limit: 2 }, true);
      const conflict = byEmail.data.find(
        (c) => c.email.toLowerCase() === input.email!.toLowerCase() && c.id !== id
      );
      if (conflict) throw new EmailAlreadyExistsError(input.email);
    }
    const updated = await this.customerRepository.update(id, input);
    if (!updated) throw new CustomerNotFoundError(id);
    return updated;
  }
}
