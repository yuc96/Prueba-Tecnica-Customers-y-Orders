export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class CustomerNotFoundError extends DomainError {
  constructor(id: number) {
    super(`Customer ${id} not found`, "CUSTOMER_NOT_FOUND", 404);
    this.name = "CustomerNotFoundError";
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(id: number) {
    super(`Product ${id} not found`, "PRODUCT_NOT_FOUND", 404);
    this.name = "ProductNotFoundError";
  }
}

export class SkuAlreadyExistsError extends DomainError {
  constructor(sku: string) {
    super(`Ya existe un producto con el SKU "${sku}".`, "SKU_ALREADY_EXISTS", 409);
    this.name = "SkuAlreadyExistsError";
  }
}

export class InsufficientStockError extends DomainError {
  constructor(productId: number, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
      "INSUFFICIENT_STOCK",
      422
    );
    this.name = "InsufficientStockError";
  }
}

export class OrderNotFoundError extends DomainError {
  constructor(id: number) {
    super(`Order ${id} not found`, "ORDER_NOT_FOUND", 404);
    this.name = "OrderNotFoundError";
  }
}

export class InvalidOrderStateError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_ORDER_STATE", 422);
    this.name = "InvalidOrderStateError";
  }
}

export class IdempotencyConflictError extends DomainError {
  constructor() {
    super("Idempotency key conflict", "IDEMPOTENCY_CONFLICT", 409);
    this.name = "IdempotencyConflictError";
  }
}
