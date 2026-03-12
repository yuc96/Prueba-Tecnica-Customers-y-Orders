import type { Request, Response, NextFunction } from "express";

const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "";

export function requireServiceToken(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = auth.slice(7);
  if (token !== SERVICE_TOKEN) {
    res.status(403).json({ error: "Invalid service token" });
    return;
  }
  next();
}
