import type { Request, Response } from "express";
import { projectCreateSchema } from "../schemas/project.js";
import * as projectModel from "../models/projectModel.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const projects = await projectModel.findAll();
    res.json(projects);
  } catch {
    res.status(500).json({ error: "Erro ao buscar projetos." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = projectCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos." });
      return;
    }
    const project = await projectModel.create(parsed.data.name);
    res.status(201).json(project);
  } catch {
    res.status(500).json({ error: "Erro ao criar projeto." });
  }
}

export async function rotateKey(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectModel.rotateKey(String(req.params.id));
    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    res.json(project);
  } catch {
    res.status(500).json({ error: "Erro ao rotacionar a API key." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const removed = await projectModel.remove(String(req.params.id));
    if (!removed) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover projeto." });
  }
}
