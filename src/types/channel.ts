export interface Channel {
  id: string;
  projectId: string;
  type: string;
  name: string;
  webhookUrl: string;
  defaultUsername: string | null;
  defaultAvatarUrl: string | null;
  defaultColor: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelRow {
  id: string;
  project_id: string;
  type: string;
  name: string;
  webhook_url: string;
  default_username: string | null;
  default_avatar_url: string | null;
  default_color: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChannel {
  type: string;
  name: string;
  webhookUrl: string;
  defaultUsername?: string | null;
  defaultAvatarUrl?: string | null;
  defaultColor?: number | null;
  isActive?: boolean;
}

export interface UpdateChannel {
  type?: string;
  name?: string;
  webhookUrl?: string;
  defaultUsername?: string | null;
  defaultAvatarUrl?: string | null;
  defaultColor?: number | null;
  isActive?: boolean;
}
