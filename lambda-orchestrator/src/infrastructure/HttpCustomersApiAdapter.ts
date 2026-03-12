import type { CustomersApiPort } from "../application/ports/CustomersApiPort.js";
import type { CustomerDto } from "../domain/dto.js";

const BASE = process.env.CUSTOMERS_API_BASE ?? "http://localhost:3001";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "";

export class HttpCustomersApiAdapter implements CustomersApiPort {
  async getCustomerById(id: number): Promise<CustomerDto | null> {
    const res = await fetch(`${BASE}/internal/customers/${id}`, {
      headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Customers API: ${res.status} ${text}`);
    }
    return (await res.json()) as CustomerDto;
  }
}
