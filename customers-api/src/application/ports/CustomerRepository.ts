import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerSearchParams,
  PaginatedCustomers,
} from "../../domain/entities/Customer.js";

export interface CustomerRepository {
  create(input: CreateCustomerInput): Promise<Customer>;
  getById(id: number, includeDeleted?: boolean): Promise<Customer | null>;
  search(params: CustomerSearchParams, includeDeleted?: boolean): Promise<PaginatedCustomers>;
  update(id: number, input: UpdateCustomerInput): Promise<Customer | null>;
  softDelete(id: number): Promise<boolean>;
}
