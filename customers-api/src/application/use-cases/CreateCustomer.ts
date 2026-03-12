import type { CustomerRepository } from "../ports/CustomerRepository.js";
import type { Customer, CreateCustomerInput } from "../../domain/entities/Customer.js";
import { EmailAlreadyExistsError } from "../../domain/errors.js";

export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    const byEmail = await this.customerRepository.search({ search: input.email, limit: 10 }, true);
    const exists = byEmail.data.some((c) => c.email.toLowerCase() === input.email.toLowerCase());
    if (exists) throw new EmailAlreadyExistsError(input.email);
    return this.customerRepository.create(input);
  }
}
