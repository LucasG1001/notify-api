import { pool } from "./connection.js";

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT NOT NULL,
      api_key_hash  TEXT NOT NULL UNIQUE,
      is_active     BOOLEAN NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS channels (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type                TEXT NOT NULL,
      name                TEXT NOT NULL,
      webhook_url         TEXT NOT NULL,
      default_username    TEXT,
      default_avatar_url  TEXT,
      default_color       INTEGER,
      is_active           BOOLEAN NOT NULL DEFAULT true,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (project_id, type)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      channel_id          UUID REFERENCES channels(id) ON DELETE SET NULL,
      type                TEXT,
      payload             JSONB NOT NULL,
      status              TEXT NOT NULL DEFAULT 'pending',
      attempts            INTEGER NOT NULL DEFAULT 0,
      error               TEXT,
      discord_message_id  TEXT,
      sent_at             TIMESTAMPTZ,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_project_id_idx ON notifications (project_id);
  `);
}
