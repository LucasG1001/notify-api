import type { Project } from "./project.js";

declare global {
  namespace Express {
    interface Request {
      project?: Project;
    }
  }
}

export {};
