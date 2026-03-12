import type { OrderRepository } from "../ports/OrderRepository.js";
import type { ProductRepository } from "../ports/ProductRepository.js";
import type { Order, OrderItem } from "../../domain/entities/Order.js";
import { OrderNotFoundError, InvalidOrderStateError } from "../../domain/errors.js";

const CONFIRMED_CANCEL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export class CancelOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async execute(orderId: number): Promise<Order & { items: OrderItem[] }> {
    const order = await this.orderRepository.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    if (order.status === "CANCELED") {
      throw new InvalidOrderStateError(`Order ${orderId} is already canceled`);
    }

    if (order.status === "CONFIRMED") {
      const created = new Date(order.created_at).getTime();
      if (Date.now() - created > CONFIRMED_CANCEL_WINDOW_MS) {
        throw new InvalidOrderStateError(
          `Order ${orderId} was confirmed more than 10 minutes ago and cannot be canceled`
        );
      }
    }

    if (order.status === "CREATED" && order.items) {
      for (const item of order.items) {
        await this.productRepository.restoreStock(item.product_id, item.qty);
      }
    }

    await this.orderRepository.updateStatus(orderId, "CANCELED");
    const updated = await this.orderRepository.getById(orderId);
    if (!updated) throw new OrderNotFoundError(orderId);
    return updated as Order & { items: OrderItem[] };
  }
}
