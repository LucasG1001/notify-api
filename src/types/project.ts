export interface Project {
  id: string;
  name: string;
  telegramBotToken: string;
  telegramChatId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithKey extends Project {
  apiKey: string;
}

/** Projeto sem dados sensíveis (token), seguro para listagens/respostas. */
export type PublicProject = Omit<Project, "telegramBotToken">;

export interface ProjectRow {
  id: string;
  name: string;
  api_key_hash: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProject {
  name: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface UpdateProject {
  name?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  isActive?: boolean;
}
