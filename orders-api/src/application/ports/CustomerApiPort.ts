export interface CustomerDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface CustomerApiPort {
  getById(id: number): Promise<CustomerDto | null>;
}
