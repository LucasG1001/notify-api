import { pool } from "../database/connection.js";
import type {
  CreateNotification,
  Notification,
  NotificationFilters,
  NotificationRow,
} from "../types/notification.js";

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    payload: row.payload,
    status: row.status,
    attempts: row.attempts,
    error: row.error,
    telegramMessageId: row.telegram_message_id,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function create(entry: CreateNotification): Promise<Notification> {
  const result = await pool.query<NotificationRow>(
    `INSERT INTO notifications (project_id, type, payload, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [entry.projectId, entry.type, JSON.stringify(entry.payload)]
  );
  return toNotification(result.rows[0]);
}

export async function markSent(id: string, telegramMessageId: string | null): Promise<Notification | null> {
  const result = await pool.query<NotificationRow>(
    `UPDATE notifications
       SET status = 'sent', attempts = attempts + 1, error = NULL,
           telegram_message_id = $2, sent_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, telegramMessageId]
  );
  return result.rows[0] ? toNotification(result.rows[0]) : null;
}

export async function markFailed(id: string, error: string): Promise<Notification | null> {
  const result = await pool.query<NotificationRow>(
    `UPDATE notifications
       SET status = 'failed', attempts = attempts + 1, error = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, error]
  );
  return result.rows[0] ? toNotification(result.rows[0]) : null;
}

export async function findAllByProject(projectId: string, filters: NotificationFilters): Promise<Notification[]> {
  const conditions: string[] = ["project_id = $1"];
  const values: unknown[] = [projectId];
  let paramIndex = 2;

  if (filters.status !== undefined) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }
  if (filters.type !== undefined) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(filters.type);
  }

  const limit = filters.limit ?? 50;
  values.push(limit);

  const result = await pool.query<NotificationRow>(
    `SELECT * FROM notifications WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${paramIndex}`,
    values
  );
  return result.rows.map(toNotification);
}

export async function findByIdForProject(id: string, projectId: string): Promise<Notification | null> {
  const result = await pool.query<NotificationRow>(
    "SELECT * FROM notifications WHERE id = $1 AND project_id = $2",
    [id, projectId]
  );
  return result.rows[0] ? toNotification(result.rows[0]) : null;
}
