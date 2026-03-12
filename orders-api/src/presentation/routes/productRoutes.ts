import { Router } from "express";
import { z } from "zod";
import { MysqlProductRepository } from "../../infrastructure/persistence/MysqlProductRepository.js";
import { CreateProductUseCase } from "../../application/use-cases/CreateProduct.js";
import { UpdateProductUseCase } from "../../application/use-cases/UpdateProduct.js";
import { GetProductUseCase } from "../../application/use-cases/GetProduct.js";
import { SearchProductsUseCase } from "../../application/use-cases/SearchProducts.js";
import { DomainError } from "../../domain/errors.js";
import { createProductSchema, updateProductSchema, parseIdParam } from "../validators/productValidators.js";
import { formatZodError } from "../validators/formatZodError.js";

const repo = new MysqlProductRepository();
const createProduct = new CreateProductUseCase(repo);
const updateProduct = new UpdateProductUseCase(repo);
const getProduct = new GetProductUseCase(repo);
const searchProducts = new SearchProductsUseCase(repo);

function toJson(p: { id: number; sku: string; name: string; price_cents: number; stock: number; created_at: Date }) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    price_cents: p.price_cents,
    stock: p.stock,
    created_at: p.created_at,
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

export function productRoutes(): Router {
  const router = Router();

  router.post("/products", async (req, res) => {
    try {
      const body = createProductSchema.parse(req.body);
      const product = await createProduct.execute(body);
      res.status(201).json(toJson(product));
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(formatZodError(e));
        return;
      }
      handleError(e, res);
    }
  });

  router.get("/products/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const product = await getProduct.execute(id);
      res.json(toJson(product));
    } catch (e) {
      if (e instanceof Error && e.message.includes("id debe ser")) {
        res.status(400).json({ error: e.message, code: "invalid_id" });
        return;
      }
      handleError(e, res);
    }
  });

  router.get("/products", async (req, res) => {
    try {
      const search = (req.query.search as string) ?? "";
      const cursor = (req.query.cursor as string) ?? undefined;
      const limit = req.query.limit != null ? Number(req.query.limit) : 20;
      const result = await searchProducts.execute({ search, cursor, limit });
      res.json({
        data: result.data.map(toJson),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (e) {
      handleError(e, res);
    }
  });

  router.patch("/products/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const body = updateProductSchema.parse(req.body);
      const product = await updateProduct.execute(id, body);
      res.json(toJson(product));
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

  return router;
}
