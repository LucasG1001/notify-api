import type { Request, Response } from "express";
import { sendNotificationSchema } from "../schemas/notification.js";
import * as channelModel from "../models/channelModel.js";
import * as notificationModel from "../models/notificationModel.js";
import { sendToWebhook } from "../services/discordService.js";
import type { Channel } from "../types/channel.js";
import type {
  DiscordPayload,
  Notification,
  NotificationFilters,
  NotificationStatus,
  SendNotificationInput,
} from "../types/notification.js";

function buildPayload(channel: Channel, input: SendNotificationInput): DiscordPayload {
  const payload: DiscordPayload = {};

  if (input.content !== undefined) payload.content = input.content;

  if (input.embeds !== undefined && input.embeds.length > 0) {
    payload.embeds = input.embeds.map((embed) =>
      embed.color === undefined && channel.defaultColor !== null
        ? { ...embed, color: channel.defaultColor }
        : embed
    );
  }

  const username = input.username ?? channel.defaultUsername;
  if (username !== null && username !== undefined) payload.username = username;

  const avatarUrl = input.avatarUrl ?? channel.defaultAvatarUrl;
  if (avatarUrl !== null && avatarUrl !== undefined) payload.avatar_url = avatarUrl;

  return payload;
}

async function deliver(notification: Notification, webhookUrl: string): Promise<Notification> {
  try {
    const { discordMessageId } = await sendToWebhook(webhookUrl, notification.payload);
    const updated = await notificationModel.markSent(notification.id, discordMessageId);
    return updated ?? notification;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar para o Discord.";
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
    const input = parsed.data;
    const projectId = req.project!.id;

    const channel = input.channelId
      ? await channelModel.findByIdForProject(input.channelId, projectId)
      : await channelModel.findByTypeForProject(input.type!, projectId);

    if (!channel) {
      res.status(404).json({ error: "Canal não encontrado." });
      return;
    }

    const payload = buildPayload(channel, input);
    const created = await notificationModel.create({
      projectId,
      channelId: channel.id,
      type: channel.type,
      payload,
    });

    const result = await deliver(created, channel.webhookUrl);
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
    if (req.query.channelId) filters.channelId = String(req.query.channelId);
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
    const projectId = req.project!.id;
    const notification = await notificationModel.findByIdForProject(String(req.params.id), projectId);
    if (!notification) {
      res.status(404).json({ error: "Notificação não encontrada." });
      return;
    }
    if (notification.status === "sent") {
      res.status(409).json({ error: "Notificação já foi enviada." });
      return;
    }
    if (!notification.channelId) {
      res.status(409).json({ error: "Canal da notificação não existe mais." });
      return;
    }
    const channel = await channelModel.findByIdForProject(notification.channelId, projectId);
    if (!channel) {
      res.status(409).json({ error: "Canal da notificação não existe mais." });
      return;
    }
    const result = await deliver(notification, channel.webhookUrl);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao reenviar notificação." });
  }
}
