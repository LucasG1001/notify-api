import axios from "axios";
import { httpRequest } from "../lib/httpClient.js";
import { findActiveWithToken, findActiveByTokenAndChat } from "../models/projectModel.js";
import { getOffset, setOffset } from "../models/pollStateModel.js";
import { answerCallbackQuery } from "./telegramService.js";

const LONG_POLL_SECONDS = 50;
const ERROR_BACKOFF_MS = 5000;
const RESCAN_INTERVAL_MS = 5 * 60 * 1000;

interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id?: number; chat?: { id?: number } };
    from?: { id?: number; first_name?: string; username?: string };
  };
}

interface GetUpdatesResponse {
  ok: boolean;
  result?: TelegramUpdate[];
  description?: string;
}

interface CallbackResponse {
  toast?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleCallback(botToken: string, update: TelegramUpdate): Promise<void> {
  const cq = update.callback_query;
  if (!cq || !cq.data) return;

  const chatId = cq.message?.chat?.id != null ? String(cq.message.chat.id) : "";
  const project = chatId ? await findActiveByTokenAndChat(botToken, chatId) : null;

  if (!project?.callbackUrl) {
    await answerCallbackQuery(botToken, cq.id, "Ação não configurada.");
    return;
  }

  let toast = "";
  try {
    const data = await httpRequest<CallbackResponse>({
      method: "post",
      url: project.callbackUrl,
      headers: project.callbackSecret ? { "x-callback-secret": project.callbackSecret } : {},
      data: {
        callbackData: cq.data,
        callbackQueryId: cq.id,
        chatId,
        messageId: cq.message?.message_id ?? null,
        from: cq.from ?? null,
      },
    });
    toast = data?.toast ?? "";
  } catch {
    toast = "Não consegui processar a ação agora.";
  }

  await answerCallbackQuery(botToken, cq.id, toast);
}

/** Loop infinito de long-polling para um bot. Roda em background. */
async function pollLoop(botToken: string): Promise<void> {
  const api = `https://api.telegram.org/bot${botToken}/getUpdates`;
  for (;;) {
    try {
      const offset = await getOffset(botToken);
      const response = await axios.get<GetUpdatesResponse>(api, {
        params: {
          timeout: LONG_POLL_SECONDS,
          offset: offset > 0 ? offset : undefined,
          allowed_updates: JSON.stringify(["callback_query"]),
        },
        timeout: (LONG_POLL_SECONDS + 15) * 1000,
      });

      const updates = response.data?.result ?? [];
      for (const update of updates) {
        await handleCallback(botToken, update);
        await setOffset(botToken, update.update_id + 1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Poller Telegram falhou (${botToken.slice(0, 8)}...):`, message);
      await delay(ERROR_BACKOFF_MS);
    }
  }
}

/**
 * Sobe um loop de getUpdates por bot token distinto. Re-escaneia periodicamente
 * para captar projetos criados após o boot. O Telegram permite apenas um poller
 * por token (409 Conflict), então a notify-api é a única dona do getUpdates.
 */
export function startTelegramPoller(): void {
  const running = new Set<string>();

  const scan = async (): Promise<void> => {
    try {
      const projects = await findActiveWithToken();
      for (const project of projects) {
        if (running.has(project.telegramBotToken)) continue;
        running.add(project.telegramBotToken);
        void pollLoop(project.telegramBotToken);
      }
    } catch (error) {
      console.error("Falha ao escanear projetos para o poller:", error);
    }
  };

  void scan();
  setInterval(() => void scan(), RESCAN_INTERVAL_MS);
}
