import express from "express";
import { customerRoutes } from "./routes/customerRoutes.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "customers-api" });
});

app.use(customerRoutes());

export default app;
