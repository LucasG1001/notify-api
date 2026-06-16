import { pool } from "./connection.js";

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                TEXT NOT NULL,
      api_key_hash        TEXT NOT NULL UNIQUE,
      telegram_bot_token  TEXT NOT NULL DEFAULT '',
      telegram_chat_id    TEXT NOT NULL DEFAULT '',
      is_active           BOOLEAN NOT NULL DEFAULT true,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Projetos já existentes (criados antes da migração para Telegram).
  await pool.query(`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT NOT NULL DEFAULT '';
  `);
  await pool.query(`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id           UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type                 TEXT,
      payload              JSONB NOT NULL,
      status               TEXT NOT NULL DEFAULT 'pending',
      attempts             INTEGER NOT NULL DEFAULT 0,
      error                TEXT,
      telegram_message_id  TEXT,
      sent_at              TIMESTAMPTZ,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Notificações criadas antes da migração usavam discord_message_id.
  await pool.query(`
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS telegram_message_id TEXT;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_project_id_idx ON notifications (project_id);
  `);
}
