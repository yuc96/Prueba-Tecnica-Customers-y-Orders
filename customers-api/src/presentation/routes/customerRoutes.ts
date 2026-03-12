import { Router } from "express";
import { z } from "zod";
import { MysqlCustomerRepository } from "../../infrastructure/persistence/MysqlCustomerRepository.js";
import { CreateCustomerUseCase } from "../../application/use-cases/CreateCustomer.js";
import { GetCustomerUseCase } from "../../application/use-cases/GetCustomer.js";
import { SearchCustomersUseCase } from "../../application/use-cases/SearchCustomers.js";
import { UpdateCustomerUseCase } from "../../application/use-cases/UpdateCustomer.js";
import { SoftDeleteCustomerUseCase } from "../../application/use-cases/SoftDeleteCustomer.js";
import { requireServiceToken } from "../middlewares/auth.js";
import { DomainError } from "../../domain/errors.js";
import { createCustomerSchema, updateCustomerSchema, parseIdParam } from "../validators/customerValidators.js";
import { formatZodError } from "../validators/formatZodError.js";

const repo = new MysqlCustomerRepository();
const createCustomer = new CreateCustomerUseCase(repo);
const getCustomer = new GetCustomerUseCase(repo);
const searchCustomers = new SearchCustomersUseCase(repo);
const updateCustomer = new UpdateCustomerUseCase(repo);
const softDeleteCustomer = new SoftDeleteCustomerUseCase(repo);

function toJson(c: { id: number; name: string; email: string; phone: string | null; created_at: Date; deleted_at: Date | null }) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    created_at: c.created_at,
    ...(c.deleted_at && { deleted_at: c.deleted_at }),
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

export function customerRoutes(): Router {
  const router = Router();

  router.post("/customers", async (req, res) => {
    try {
      const body = createCustomerSchema.parse(req.body);
      const customer = await createCustomer.execute(body);
      res.status(201).json(toJson(customer));
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(formatZodError(e));
        return;
      }
      handleError(e, res);
    }
  });

  router.get("/customers/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const customer = await getCustomer.execute(id, false);
      res.json(toJson(customer));
    } catch (e) {
      if (e instanceof Error && e.message.includes("id debe ser")) {
        res.status(400).json({ error: e.message, code: "invalid_id" });
        return;
      }
      handleError(e, res);
    }
  });

  router.get("/customers", async (req, res) => {
    try {
      const search = (req.query.search as string) ?? "";
      const cursor = (req.query.cursor as string) ?? undefined;
      const limit = req.query.limit != null ? Number(req.query.limit) : 20;
      const result = await searchCustomers.execute({ search, cursor, limit }, false);
      res.json({
        data: result.data.map(toJson),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (e) {
      handleError(e, res);
    }
  });

  router.put("/customers/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const body = updateCustomerSchema.parse(req.body);
      const customer = await updateCustomer.execute(id, body);
      res.json(toJson(customer));
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(formatZodError(e));
        return;
      }
      if (e instanceof Error && e.message.includes("id debe ser")) {
        res.status(400).json({ error: e.message, code: "invalid_id" });
        return;
      }
      handleError(e, res);
    }
  });

  router.delete("/customers/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      await softDeleteCustomer.execute(id);
      res.status(204).send();
    } catch (e) {
      if (e instanceof Error && e.message.includes("id debe ser")) {
        res.status(400).json({ error: e.message, code: "invalid_id" });
        return;
      }
      handleError(e, res);
    }
  });

  // Internal route: same GET but requires SERVICE_TOKEN (for Orders API)
  router.get("/internal/customers/:id", requireServiceToken, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const customer = await getCustomer.execute(id, false);
      res.json(toJson(customer));
    } catch (e) {
      handleError(e, res);
    }
  });

  return router;
}
