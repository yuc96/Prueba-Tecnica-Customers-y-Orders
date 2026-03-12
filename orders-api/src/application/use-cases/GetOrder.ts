import type { OrderRepository } from "../ports/OrderRepository.js";
import type { Order, OrderItem } from "../../domain/entities/Order.js";
import { OrderNotFoundError } from "../../domain/errors.js";

export class GetOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(id: number): Promise<Order & { items: OrderItem[] }> {
    const order = await this.orderRepository.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    return order;
  }
}
