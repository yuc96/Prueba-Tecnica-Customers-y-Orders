import { CreateAndConfirmOrderUseCase } from "./application/use-cases/CreateAndConfirmOrder.js";
import { HttpCustomersApiAdapter } from "./infrastructure/HttpCustomersApiAdapter.js";
import { HttpOrdersApiAdapter } from "./infrastructure/HttpOrdersApiAdapter.js";
import type { CreateAndConfirmOrderRequest } from "./domain/dto.js";

const customersApi = new HttpCustomersApiAdapter();
const ordersApi = new HttpOrdersApiAdapter();
const useCase = new CreateAndConfirmOrderUseCase(customersApi, ordersApi);

interface HttpApiEvent {
  body?: string;
  requestContext?: { http?: { method?: string } };
}

interface HttpApiResult {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

export async function createAndConfirmOrder(
  event: HttpApiEvent
): Promise<HttpApiResult> {
  const body = event.body;
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Missing body" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  let request: CreateAndConfirmOrderRequest;
  try {
    request = JSON.parse(body) as CreateAndConfirmOrderRequest;
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Invalid JSON" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  if (
    typeof request.customer_id !== "number" ||
    !Array.isArray(request.items) ||
    !request.idempotency_key
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: "Missing or invalid: customer_id, items, idempotency_key",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const result = await useCase.execute(request);
    return {
      statusCode: 201,
      body: JSON.stringify(result),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const statusCode = message.includes("not found") ? 404 : message.includes("stock") ? 422 : 500;
    return {
      statusCode,
      body: JSON.stringify({ success: false, error: message }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
