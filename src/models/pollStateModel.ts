import { pool } from "../database/connection.js";

interface PollStateRow {
  offset_value: string;
}

/** Próximo offset do getUpdates para o bot, ou 0 se ainda não houver registro. */
export async function getOffset(botToken: string): Promise<number> {
  const result = await pool.query<PollStateRow>(
    "SELECT offset_value FROM telegram_poll_state WHERE bot_token = $1",
    [botToken]
  );
  return result.rows[0] ? Number(result.rows[0].offset_value) : 0;
}

export async function setOffset(botToken: string, offset: number): Promise<void> {
  await pool.query(
    `INSERT INTO telegram_poll_state (bot_token, offset_value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (bot_token)
     DO UPDATE SET offset_value = EXCLUDED.offset_value, updated_at = NOW()`,
    [botToken, offset]
  );
}
