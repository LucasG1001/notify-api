import { z } from "zod";

const nullableString = z.string().nullish();
const color = z.number().int().min(0).max(16777215).nullish();

export const channelCreateSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  webhookUrl: z.string().url(),
  defaultUsername: nullableString,
  defaultAvatarUrl: z.string().url().nullish(),
  defaultColor: color,
  isActive: z.boolean().optional(),
});

export const channelUpdateSchema = channelCreateSchema.partial();
