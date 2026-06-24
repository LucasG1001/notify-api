export interface Project {
  id: string;
  name: string;
  telegramBotToken: string;
  telegramChatId: string;
  /** Para onde repassar os callback_query (cliques em botão). Null = não recebe. */
  callbackUrl: string | null;
  /** Segredo enviado no header x-callback-secret ao chamar a callbackUrl. */
  callbackSecret: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithKey extends Project {
  apiKey: string;
}

/** Projeto sem dados sensíveis (token/segredo), seguro para listagens/respostas. */
export type PublicProject = Omit<Project, "telegramBotToken" | "callbackSecret">;

export interface ProjectRow {
  id: string;
  name: string;
  api_key_hash: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  callback_url: string | null;
  callback_secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProject {
  name: string;
  telegramBotToken: string;
  telegramChatId: string;
  callbackUrl?: string;
  callbackSecret?: string;
}

export interface UpdateProject {
  name?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  callbackUrl?: string;
  callbackSecret?: string;
  isActive?: boolean;
}
