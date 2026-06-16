export type NotificationStatus = "pending" | "sent" | "failed";

export interface NotificationField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface NotificationButton {
  text: string;
  url: string;
}

/**
 * Payload genérico, independente de provedor. O serviço de Telegram converte
 * isto em sendPhoto/sendMessage (legenda HTML + inline keyboard).
 */
export interface NotificationPayload {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  fields?: NotificationField[];
  buttons?: NotificationButton[];
}

export interface Notification {
  id: string;
  projectId: string;
  type: string | null;
  payload: NotificationPayload;
  status: NotificationStatus;
  attempts: number;
  error: string | null;
  telegramMessageId: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRow {
  id: string;
  project_id: string;
  type: string | null;
  payload: NotificationPayload;
  status: NotificationStatus;
  attempts: number;
  error: string | null;
  telegram_message_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotification {
  projectId: string;
  type: string | null;
  payload: NotificationPayload;
}

export interface SendNotificationInput extends NotificationPayload {
  type?: string;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: string;
  limit?: number;
}
