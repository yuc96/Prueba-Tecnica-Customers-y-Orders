import { Router } from "express";
import { z } from "zod";
import { HttpCustomerApiAdapter } from "../../infrastructure/http/CustomerApiAdapter.js";
import { MysqlProductRepository } from "../../infrastructure/persistence/MysqlProductRepository.js";
import { MysqlOrderRepository } from "../../infrastructure/persistence/MysqlOrderRepository.js";
import { MysqlIdempotencyStore } from "../../infrastructure/persistence/MysqlIdempotencyStore.js";
import { CreateOrderUseCase } from "../../application/use-cases/CreateOrder.js";
import { GetOrderUseCase } from "../../application/use-cases/GetOrder.js";
import { ListOrdersUseCase } from "../../application/use-cases/ListOrders.js";
import { ConfirmOrderUseCase } from "../../application/use-cases/ConfirmOrder.js";
import { CancelOrderUseCase } from "../../application/use-cases/CancelOrder.js";
import { DomainError } from "../../domain/errors.js";
import { createOrderSchema, parseOrderIdParam } from "../validators/orderValidators.js";
import { formatZodError } from "../validators/formatZodError.js";

const customerApi = new HttpCustomerApiAdapter();
const productRepo = new MysqlProductRepository();
const orderRepo = new MysqlOrderRepository();
const idempotencyStore = new MysqlIdempotencyStore();

const createOrder = new CreateOrderUseCase(customerApi, productRepo, orderRepo);
const getOrder = new GetOrderUseCase(orderRepo);
const listOrders = new ListOrdersUseCase(orderRepo);
const confirmOrder = new ConfirmOrderUseCase(orderRepo, idempotencyStore);
const cancelOrder = new CancelOrderUseCase(orderRepo, productRepo);

function orderToJson(order: { id: number; customer_id: number; status: string; total_cents: number; created_at: Date; items?: { id: number; order_id: number; product_id: number; qty: number; unit_price_cents: number; subtotal_cents: number }[] }) {
  return {
    id: order.id,
    customer_id: order.customer_id,
    status: order.status,
    total_cents: order.total_cents,
    created_at: order.created_at,
    ...(order.items && { items: order.items }),
  };
}

function handleError(err: unknown, res: { status: (n: number) => { json: (o: object) => void } }) {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

export function orderRoutes(): Router {
  const router = Router();

  router.post("/orders", async (req, res) => {
    try {
      const body = createOrderSchema.parse(req.body);
      const order = await createOrder.execute(body);
      res.status(201).json(orderToJson(order));
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(formatZodError(e));
        return;
      }
      handleError(e, res);
    }
  });

  router.get("/orders/:id", async (req, res) => {
    try {
      const id = parseOrderIdParam(req.params.id);
      const order = await getOrder.execute(id);
      res.json(orderToJson(order));
    } catch (e) {
      if (e instanceof Error && e.message.includes("id debe ser")) {
        res.status(400).json({ error: e.message, code: "invalid_id" });
        return;
      }
      handleError(e, res);
    }
  });

  router.get("/orders", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit != null ? Number(req.query.limit) : 20;
      const result = await listOrders.execute({
        status: status as "CREATED" | "CONFIRMED" | "CANCELED" | undefined,
        from,
        to,
        cursor,
        limit,
      });
      res.json({
        data: result.data.map(orderToJson),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (e) {
      handleError(e, res);
    }
  });

  router.post("/orders/:id/confirm", async (req, res) => {
    try {
      const id = parseOrderIdParam(req.params.id);
      const idempotencyKey = req.headers["x-idempotency-key"] as string;
      if (!idempotencyKey || typeof idempotencyKey !== "string") {
        res.status(400).json({ error: "X-Idempotency-Key header is required", code: "missing_header" });
        return;
      }
      const order = await confirmOrder.execute(id, idempotencyKey);
      res.json(orderToJson(order));
    } catch (e) {
      if (e instanceof Error && e.message.includes("id debe ser")) {
        res.status(400).json({ error: e.message, code: "invalid_id" });
        return;
      }
      handleError(e, res);
    }
  });

  router.post("/orders/:id/cancel", async (req, res) => {
    try {
      const id = parseOrderIdParam(req.params.id);
      const order = await cancelOrder.execute(id);
      res.json(orderToJson(order));
    } catch (e) {
      if (e instanceof Error && e.message.includes("id debe ser")) {
        res.status(400).json({ error: e.message, code: "invalid_id" });
        return;
      }
      handleError(e, res);
    }
  });

  return router;
}
