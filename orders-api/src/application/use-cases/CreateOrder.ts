import type { CustomerApiPort } from "../ports/CustomerApiPort.js";
import type { ProductRepository } from "../ports/ProductRepository.js";
import type { OrderRepository } from "../ports/OrderRepository.js";
import type { Order, OrderItem } from "../../domain/entities/Order.js";
import { CustomerNotFoundError, ProductNotFoundError, InsufficientStockError } from "../../domain/errors.js";

export class CreateOrderUseCase {
  constructor(
    private readonly customerApi: CustomerApiPort,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository
  ) {}

  async execute(input: { customer_id: number; items: { product_id: number; qty: number }[] }): Promise<Order & { items: OrderItem[] }> {
    const customer = await this.customerApi.getById(input.customer_id);
    if (!customer) throw new CustomerNotFoundError(input.customer_id);

    const productIds = [...new Set(input.items.map((i) => i.product_id))];
    const products = await this.productRepository.getByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const id of productIds) {
      if (!productMap.has(id)) throw new ProductNotFoundError(id);
    }

    const orderItems: { product_id: number; qty: number; unit_price_cents: number; subtotal_cents: number }[] = [];
    for (const line of input.items) {
      const product = productMap.get(line.product_id)!;
      if (product.stock < line.qty) {
        throw new InsufficientStockError(line.product_id, line.qty, product.stock);
      }
      const unit_price_cents = product.price_cents;
      const subtotal_cents = unit_price_cents * line.qty;
      orderItems.push({ product_id: line.product_id, qty: line.qty, unit_price_cents, subtotal_cents });
    }

    const order = await this.orderRepository.create(
      { customer_id: input.customer_id, items: input.items },
      orderItems
    );

    const items = await this.orderRepository.getOrderItems(order.id);
    return { ...order, items };
  }
}
