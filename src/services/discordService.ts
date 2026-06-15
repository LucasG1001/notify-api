import { httpRequest } from "../lib/httpClient.js";
import type { DiscordPayload } from "../types/notification.js";

interface DiscordMessageResponse {
  id?: string;
}

export async function sendToWebhook(
  webhookUrl: string,
  payload: DiscordPayload
): Promise<{ discordMessageId: string | null }> {
  const body: DiscordPayload = {};
  if (payload.content !== undefined) body.content = payload.content;
  if (payload.embeds !== undefined && payload.embeds.length > 0) body.embeds = payload.embeds;
  if (payload.username !== undefined) body.username = payload.username;
  if (payload.avatar_url !== undefined) body.avatar_url = payload.avatar_url;

  const data = await httpRequest<DiscordMessageResponse>({
    method: "post",
    url: webhookUrl,
    params: { wait: true },
    data: body,
  });

  return { discordMessageId: data?.id ?? null };
}
