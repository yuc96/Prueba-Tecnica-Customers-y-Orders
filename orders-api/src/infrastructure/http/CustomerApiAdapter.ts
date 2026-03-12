import type { CustomerApiPort, CustomerDto } from "../../application/ports/CustomerApiPort.js";

const BASE = process.env.CUSTOMERS_API_BASE ?? "http://localhost:3001";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "";

export class HttpCustomerApiAdapter implements CustomerApiPort {
  async getById(id: number): Promise<CustomerDto | null> {
    const res = await fetch(`${BASE}/internal/customers/${id}`, {
      headers: {
        Authorization: `Bearer ${SERVICE_TOKEN}`,
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Customers API error: ${res.status} ${text}`);
    }
    const data = (await res.json()) as CustomerDto;
    return data;
  }
}
