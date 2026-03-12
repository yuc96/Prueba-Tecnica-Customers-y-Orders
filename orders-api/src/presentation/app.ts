import express from "express";
import { productRoutes } from "./routes/productRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "orders-api" });
});

app.use(productRoutes());
app.use(orderRoutes());

export default app;
