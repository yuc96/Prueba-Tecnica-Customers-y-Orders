export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerSearchParams {
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedCustomers {
  data: Customer[];
  nextCursor: string | null;
  hasMore: boolean;
}
