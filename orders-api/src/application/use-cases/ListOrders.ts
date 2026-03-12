import type { OrderRepository } from "../ports/OrderRepository.js";
import type { OrderListParams, PaginatedOrders } from "../../domain/entities/Order.js";

export class ListOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(params: OrderListParams): Promise<PaginatedOrders> {
    return this.orderRepository.list(params);
  }
}
