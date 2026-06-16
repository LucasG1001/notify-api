import { httpRequest } from "../lib/httpClient.js";
import type { NotificationPayload } from "../types/notification.js";

const CAPTION_LIMIT = 1024; // limite do Telegram para legenda de foto
const TEXT_LIMIT = 4096; // limite do Telegram para mensagem de texto

interface TelegramResponse {
  ok: boolean;
  result?: { message_id?: number };
  description?: string;
}

interface InlineButton {
  text: string;
  url: string;
}

/** Escapa os caracteres reservados do parse_mode HTML do Telegram. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildCaption(payload: NotificationPayload): string {
  const parts: string[] = [];

  if (payload.title) parts.push(`<b>${escapeHtml(payload.title)}</b>`);
  if (payload.description) parts.push(escapeHtml(payload.description));

  if (payload.fields && payload.fields.length > 0) {
    const lines = payload.fields.map(
      (f) => `<b>${escapeHtml(f.name)}:</b> ${escapeHtml(f.value)}`
    );
    parts.push(lines.join("\n"));
  }

  if (payload.url) {
    parts.push(`🔗 <a href="${escapeHtml(payload.url)}">Abrir</a>`);
  }

  // Blocos separados por linha em branco.
  return parts.join("\n\n");
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function buildReplyMarkup(payload: NotificationPayload): { inline_keyboard: InlineButton[][] } | undefined {
  if (!payload.buttons || payload.buttons.length === 0) return undefined;
  const rows: InlineButton[][] = [];
  for (let i = 0; i < payload.buttons.length; i += 2) {
    rows.push(payload.buttons.slice(i, i + 2).map((b) => ({ text: b.text, url: b.url })));
  }
  return { inline_keyboard: rows };
}

export async function sendTelegram(
  botToken: string,
  chatId: string,
  payload: NotificationPayload
): Promise<{ telegramMessageId: string | null }> {
  if (!botToken || !chatId) {
    throw new Error("Projeto sem token do bot ou chat_id do Telegram configurado.");
  }

  const api = `https://api.telegram.org/bot${botToken}`;
  const caption = buildCaption(payload);
  const replyMarkup = buildReplyMarkup(payload);

  const hasImage = Boolean(payload.image);
  const method = hasImage ? "sendPhoto" : "sendMessage";
  const limit = hasImage ? CAPTION_LIMIT : TEXT_LIMIT;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    parse_mode: "HTML",
    disable_web_page_preview: false,
  };
  if (hasImage) {
    body.photo = payload.image;
    body.caption = truncate(caption, limit);
  } else {
    body.text = truncate(caption, limit);
  }
  if (replyMarkup) body.reply_markup = replyMarkup;

  const data = await httpRequest<TelegramResponse>({
    method: "post",
    url: `${api}/${method}`,
    data: body,
  });

  if (!data?.ok) {
    throw new Error(data?.description ?? "Falha ao enviar para o Telegram.");
  }

  const messageId = data.result?.message_id;
  return { telegramMessageId: messageId !== undefined ? String(messageId) : null };
}
