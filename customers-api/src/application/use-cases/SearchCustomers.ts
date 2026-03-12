import type { CustomerRepository } from "../ports/CustomerRepository.js";
import type { CustomerSearchParams, PaginatedCustomers } from "../../domain/entities/Customer.js";

export class SearchCustomersUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(params: CustomerSearchParams, includeDeleted = false): Promise<PaginatedCustomers> {
    return this.customerRepository.search(params, includeDeleted);
  }
}
