import type { CustomerRepository } from "../ports/CustomerRepository.js";
import type { Customer } from "../../domain/entities/Customer.js";
import { CustomerNotFoundError } from "../../domain/errors.js";

export class GetCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(id: number, includeDeleted = false): Promise<Customer> {
    const customer = await this.customerRepository.getById(id, includeDeleted);
    if (!customer) {
      throw new CustomerNotFoundError(id);
    }
    return customer;
  }
}
