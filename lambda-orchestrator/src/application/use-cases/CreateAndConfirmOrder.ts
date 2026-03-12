import type { CustomersApiPort } from "../ports/CustomersApiPort.js";
import type { OrdersApiPort } from "../ports/OrdersApiPort.js";
import type {
  CreateAndConfirmOrderRequest,
  CreateAndConfirmOrderResponse,
  CustomerDto,
  OrderDto,
} from "../../domain/dto.js";

export class CreateAndConfirmOrderUseCase {
  constructor(
    private readonly customersApi: CustomersApiPort,
    private readonly ordersApi: OrdersApiPort
  ) {}

  async execute(
    request: CreateAndConfirmOrderRequest
  ): Promise<CreateAndConfirmOrderResponse> {
    const customer = await this.customersApi.getCustomerById(request.customer_id);
    if (!customer) {
      throw new Error(`Customer ${request.customer_id} not found`);
    }

    const order = await this.ordersApi.createOrder(request.customer_id, request.items);
    const confirmedOrder = await this.ordersApi.confirmOrder(
      order.id,
      request.idempotency_key
    );

    return {
      success: true,
      correlationId: request.correlation_id,
      data: {
        customer,
        order: confirmedOrder,
      },
    };
  }
}
