import type { OrderRepository } from "../ports/OrderRepository.js";
import type { IdempotencyStore } from "../ports/IdempotencyStore.js";
import type { Order, OrderItem } from "../../domain/entities/Order.js";
import { OrderNotFoundError, InvalidOrderStateError } from "../../domain/errors.js";

export class ConfirmOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly idempotencyStore: IdempotencyStore
  ) {}

  async execute(
    orderId: number,
    idempotencyKey: string
  ): Promise<Order & { items: OrderItem[] }> {
    const existing = await this.idempotencyStore.get(idempotencyKey);
    if (existing && existing.target_type === "order_confirm" && String(existing.target_id) === String(orderId)) {
      return existing.response_body as Order & { items: OrderItem[] };
    }

    const order = await this.orderRepository.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.status === "CANCELED") {
      throw new InvalidOrderStateError("La orden ya fue cancelada y no se puede confirmar.");
    }
    if (order.status === "CONFIRMED") {
      throw new InvalidOrderStateError("La orden ya fue confirmada y no se puede volver a confirmar.");
    }
    if (order.status !== "CREATED") {
      throw new InvalidOrderStateError(`El estado de la orden (${order.status}) no permite confirmarla.`);
    }

    await this.orderRepository.updateStatus(orderId, "CONFIRMED");
    const updated = await this.orderRepository.getById(orderId);
    if (!updated) throw new OrderNotFoundError(orderId);

    const result = updated as Order & { items: OrderItem[] };
    await this.idempotencyStore.set(
      idempotencyKey,
      "order_confirm",
      String(orderId),
      "completed",
      result,
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    return result;
  }
}
