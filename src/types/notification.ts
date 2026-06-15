export type NotificationStatus = "pending" | "sent" | "failed";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: DiscordEmbedField[];
}

export interface DiscordPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export interface Notification {
  id: string;
  projectId: string;
  channelId: string | null;
  type: string | null;
  payload: DiscordPayload;
  status: NotificationStatus;
  attempts: number;
  error: string | null;
  discordMessageId: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRow {
  id: string;
  project_id: string;
  channel_id: string | null;
  type: string | null;
  payload: DiscordPayload;
  status: NotificationStatus;
  attempts: number;
  error: string | null;
  discord_message_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotification {
  projectId: string;
  channelId: string;
  type: string;
  payload: DiscordPayload;
}

export interface SendNotificationInput {
  type?: string;
  channelId?: string;
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatarUrl?: string;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: string;
  channelId?: string;
  limit?: number;
}
