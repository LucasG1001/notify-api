import type { Request, Response } from "express";
import { channelCreateSchema, channelUpdateSchema } from "../schemas/channel.js";
import * as channelModel from "../models/channelModel.js";

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const channels = await channelModel.findAllByProject(req.project!.id);
    res.json(channels);
  } catch {
    res.status(500).json({ error: "Erro ao buscar canais." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = channelCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos." });
      return;
    }
    if (await channelModel.existsType(parsed.data.type, req.project!.id)) {
      res.status(409).json({ error: "Já existe um canal com esse tipo." });
      return;
    }
    const channel = await channelModel.create(req.project!.id, parsed.data);
    res.status(201).json(channel);
  } catch {
    res.status(500).json({ error: "Erro ao criar canal." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const parsed = channelUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos." });
      return;
    }
    const channel = await channelModel.update(String(req.params.id), req.project!.id, parsed.data);
    if (!channel) {
      res.status(404).json({ error: "Canal não encontrado." });
      return;
    }
    res.json(channel);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar canal." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const removed = await channelModel.remove(String(req.params.id), req.project!.id);
    if (!removed) {
      res.status(404).json({ error: "Canal não encontrado." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover canal." });
  }
}
