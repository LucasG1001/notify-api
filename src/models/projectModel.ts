import { pool } from "../database/connection.js";
import { generateApiKey, hashApiKey } from "../lib/apiKey.js";
import type { Project, ProjectRow, ProjectWithKey } from "../types/project.js";

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<Project[]> {
  const result = await pool.query<ProjectRow>("SELECT * FROM projects ORDER BY created_at DESC");
  return result.rows.map(toProject);
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

export async function create(name: string): Promise<ProjectWithKey> {
  const apiKey = generateApiKey();
  const result = await pool.query<ProjectRow>(
    "INSERT INTO projects (name, api_key_hash) VALUES ($1, $2) RETURNING *",
    [name, hashApiKey(apiKey)]
  );
  return { ...toProject(result.rows[0]), apiKey };
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
