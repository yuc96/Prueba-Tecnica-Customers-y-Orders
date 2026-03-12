import type { CustomerDto } from "../../domain/dto.js";

export interface CustomersApiPort {
  getCustomerById(id: number): Promise<CustomerDto | null>;
}
