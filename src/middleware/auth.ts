import type { Request, Response, NextFunction } from "express";
import { hashApiKey, safeCompare } from "../lib/apiKey.js";
import { findActiveByKeyHash } from "../models/projectModel.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = req.header("x-admin-key");
  if (!adminKey || !provided || !safeCompare(provided, adminKey)) {
    res.status(401).json({ error: "Chave de administrador inválida." });
    return;
  }
  next();
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const provided = req.header("x-api-key");
    if (!provided) {
      res.status(401).json({ error: "API key inválida." });
      return;
    }
    const project = await findActiveByKeyHash(hashApiKey(provided));
    if (!project) {
      res.status(401).json({ error: "API key inválida." });
      return;
    }
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
}
