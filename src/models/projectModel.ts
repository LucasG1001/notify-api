import { pool } from "../database/connection.js";
import { generateApiKey, hashApiKey } from "../lib/apiKey.js";
import type {
  CreateProject,
  Project,
  ProjectRow,
  ProjectWithKey,
  PublicProject,
  UpdateProject,
} from "../types/project.js";

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    telegramBotToken: row.telegram_bot_token,
    telegramChatId: row.telegram_chat_id,
    callbackUrl: row.callback_url,
    callbackSecret: row.callback_secret,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Remove dados sensíveis (token/segredo) — usado em respostas/listagens públicas. */
export function toPublic(project: Project): PublicProject {
  const { telegramBotToken: _token, callbackSecret: _secret, ...rest } = project;
  return rest;
}

/** Projetos ativos com bot token — usado pelo poller para abrir os loops de getUpdates. */
export async function findActiveWithToken(): Promise<Project[]> {
  const result = await pool.query<ProjectRow>(
    "SELECT * FROM projects WHERE is_active = true AND telegram_bot_token <> ''"
  );
  return result.rows.map(toProject);
}

/** Resolve o projeto dono de um callback pelo par (token do bot, chat_id). */
export async function findActiveByTokenAndChat(
  botToken: string,
  chatId: string
): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    "SELECT * FROM projects WHERE telegram_bot_token = $1 AND telegram_chat_id = $2 AND is_active = true LIMIT 1",
    [botToken, chatId]
  );
  return result.rows[0] ? toProject(result.rows[0]) : null;
}

export async function findAll(): Promise<PublicProject[]> {
  const result = await pool.query<ProjectRow>("SELECT * FROM projects ORDER BY created_at DESC");
  return result.rows.map((row) => toPublic(toProject(row)));
}

export async function findById(id: string): Promise<Project | null> {
  const result = await pool.query<ProjectRow>("SELECT * FROM projects WHERE id = $1", [id]);
  return result.rows[0] ? toProject(result.rows[0]) : null;
}

export async function findActiveByKeyHash(keyHash: string): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    "SELECT * FROM projects WHERE api_key_hash = $1 AND is_active = true",
    [keyHash]
  );
  return result.rows[0] ? toProject(result.rows[0]) : null;
}

export async function create(data: CreateProject): Promise<ProjectWithKey> {
  const apiKey = generateApiKey();
  const result = await pool.query<ProjectRow>(
    `INSERT INTO projects (name, api_key_hash, telegram_bot_token, telegram_chat_id, callback_url, callback_secret)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.name,
      hashApiKey(apiKey),
      data.telegramBotToken,
      data.telegramChatId,
      data.callbackUrl ?? null,
      data.callbackSecret ?? null,
    ]
  );
  return { ...toProject(result.rows[0]), apiKey };
}

export async function update(id: string, data: UpdateProject): Promise<PublicProject | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(data.name);
  }
  if (data.telegramBotToken !== undefined) {
    sets.push(`telegram_bot_token = $${i++}`);
    values.push(data.telegramBotToken);
  }
  if (data.telegramChatId !== undefined) {
    sets.push(`telegram_chat_id = $${i++}`);
    values.push(data.telegramChatId);
  }
  if (data.callbackUrl !== undefined) {
    sets.push(`callback_url = $${i++}`);
    values.push(data.callbackUrl);
  }
  if (data.callbackSecret !== undefined) {
    sets.push(`callback_secret = $${i++}`);
    values.push(data.callbackSecret);
  }
  if (data.isActive !== undefined) {
    sets.push(`is_active = $${i++}`);
    values.push(data.isActive);
  }
  if (sets.length === 0) return findById(id).then((p) => (p ? toPublic(p) : null));

  sets.push(`updated_at = NOW()`);
  values.push(id);
  const result = await pool.query<ProjectRow>(
    `UPDATE projects SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0] ? toPublic(toProject(result.rows[0])) : null;
}

export async function rotateKey(id: string): Promise<ProjectWithKey | null> {
  const apiKey = generateApiKey();
  const result = await pool.query<ProjectRow>(
    "UPDATE projects SET api_key_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [hashApiKey(apiKey), id]
  );
  return result.rows[0] ? { ...toProject(result.rows[0]), apiKey } : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
