import type { Request, Response } from "express";
import { sendNotificationSchema } from "../schemas/notification.js";
import * as notificationModel from "../models/notificationModel.js";
import { sendTelegram } from "../services/telegramService.js";
import type {
  Notification,
  NotificationFilters,
  NotificationPayload,
  NotificationStatus,
} from "../types/notification.js";
import type { Project } from "../types/project.js";

async function deliver(notification: Notification, project: Project): Promise<Notification> {
  try {
    const { telegramMessageId } = await sendTelegram(
      project.telegramBotToken,
      project.telegramChatId,
      notification.payload
    );
    const updated = await notificationModel.markSent(notification.id, telegramMessageId);
    return updated ?? notification;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar para o Telegram.";
    const updated = await notificationModel.markFailed(notification.id, message);
    return updated ?? notification;
  }
}

export async function send(req: Request, res: Response): Promise<void> {
  try {
    const parsed = sendNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
      return;
    }
    const project = req.project!;
    if (!project.telegramBotToken || !project.telegramChatId) {
      res.status(409).json({ error: "Projeto sem token do bot ou chat_id do Telegram configurado." });
      return;
    }

    const { type, ...payload } = parsed.data;

    const created = await notificationModel.create({
      projectId: project.id,
      type: type ?? null,
      payload: payload as NotificationPayload,
    });

    const result = await deliver(created, project);
    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: "Erro ao enviar notificação." });
  }
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const filters: NotificationFilters = {};
    const status = req.query.status as string | undefined;
    if (status) filters.status = status as NotificationStatus;
    if (req.query.type) filters.type = String(req.query.type);
    const limit = parseInt(String(req.query.limit ?? ""), 10);
    if (!Number.isNaN(limit)) filters.limit = Math.min(Math.max(limit, 1), 200);

    const notifications = await notificationModel.findAllByProject(req.project!.id, filters);
    res.json(notifications);
  } catch {
    res.status(500).json({ error: "Erro ao buscar notificações." });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const notification = await notificationModel.findByIdForProject(String(req.params.id), req.project!.id);
    if (!notification) {
      res.status(404).json({ error: "Notificação não encontrada." });
      return;
    }
    res.json(notification);
  } catch {
    res.status(500).json({ error: "Erro ao buscar notificação." });
  }
}

export async function retry(req: Request, res: Response): Promise<void> {
  try {
    const project = req.project!;
    const notification = await notificationModel.findByIdForProject(String(req.params.id), project.id);
    if (!notification) {
      res.status(404).json({ error: "Notificação não encontrada." });
      return;
    }
    if (notification.status === "sent") {
      res.status(409).json({ error: "Notificação já foi enviada." });
      return;
    }
    const result = await deliver(notification, project);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao reenviar notificação." });
  }
}
