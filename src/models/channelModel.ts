import { pool } from "../database/connection.js";
import type { Channel, ChannelRow, CreateChannel, UpdateChannel } from "../types/channel.js";

function toChannel(row: ChannelRow): Channel {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    name: row.name,
    webhookUrl: row.webhook_url,
    defaultUsername: row.default_username,
    defaultAvatarUrl: row.default_avatar_url,
    defaultColor: row.default_color,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAllByProject(projectId: string): Promise<Channel[]> {
  const result = await pool.query<ChannelRow>(
    "SELECT * FROM channels WHERE project_id = $1 ORDER BY type ASC",
    [projectId]
  );
  return result.rows.map(toChannel);
}

export async function findByIdForProject(id: string, projectId: string): Promise<Channel | null> {
  const result = await pool.query<ChannelRow>(
    "SELECT * FROM channels WHERE id = $1 AND project_id = $2",
    [id, projectId]
  );
  return result.rows[0] ? toChannel(result.rows[0]) : null;
}

export async function findByTypeForProject(type: string, projectId: string): Promise<Channel | null> {
  const result = await pool.query<ChannelRow>(
    "SELECT * FROM channels WHERE type = $1 AND project_id = $2 AND is_active = true",
    [type, projectId]
  );
  return result.rows[0] ? toChannel(result.rows[0]) : null;
}

export async function existsType(type: string, projectId: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM channels WHERE type = $1 AND project_id = $2",
    [type, projectId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function create(projectId: string, data: CreateChannel): Promise<Channel> {
  const result = await pool.query<ChannelRow>(
    `INSERT INTO channels
       (project_id, type, name, webhook_url, default_username, default_avatar_url, default_color, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      projectId,
      data.type,
      data.name,
      data.webhookUrl,
      data.defaultUsername ?? null,
      data.defaultAvatarUrl ?? null,
      data.defaultColor ?? null,
      data.isActive ?? true,
    ]
  );
  return toChannel(result.rows[0]);
}

export async function update(id: string, projectId: string, data: UpdateChannel): Promise<Channel | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const columns: Record<string, unknown> = {
    type: data.type,
    name: data.name,
    webhook_url: data.webhookUrl,
    default_username: data.defaultUsername,
    default_avatar_url: data.defaultAvatarUrl,
    default_color: data.defaultColor,
    is_active: data.isActive,
  };

  for (const [column, value] of Object.entries(columns)) {
    if (value !== undefined) {
      fields.push(`${column} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return findByIdForProject(id, projectId);

  fields.push("updated_at = NOW()");
  values.push(id, projectId);

  const result = await pool.query<ChannelRow>(
    `UPDATE channels SET ${fields.join(", ")} WHERE id = $${paramIndex++} AND project_id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toChannel(result.rows[0]) : null;
}

export async function remove(id: string, projectId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM channels WHERE id = $1 AND project_id = $2", [id, projectId]);
  return (result.rowCount ?? 0) > 0;
}
