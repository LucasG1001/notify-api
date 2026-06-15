export interface Project {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithKey extends Project {
  apiKey: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  api_key_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProject {
  name: string;
}
