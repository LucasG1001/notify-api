import { z } from "zod";

const field = z.object({
  name: z.string().min(1).max(256),
  value: z.string().min(1).max(1024),
  inline: z.boolean().optional(),
});

const button = z.object({
  text: z.string().min(1).max(64),
  url: z.string().url(),
});

export const sendNotificationSchema = z
  .object({
    type: z.string().min(1).optional(),
    title: z.string().max(256).optional(),
    description: z.string().max(4096).optional(),
    image: z.string().url().optional(),
    url: z.string().url().optional(),
    fields: z.array(field).max(25).optional(),
    buttons: z.array(button).max(20).optional(),
  })
  .refine((data) => Boolean(data.title) || Boolean(data.description), {
    message: "Informe title ou description.",
  });
