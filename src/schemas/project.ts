import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1),
});
