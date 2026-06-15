import { z } from "zod";

const embedField = z.object({
  name: z.string().min(1).max(256),
  value: z.string().min(1).max(1024),
  inline: z.boolean().optional(),
});

const embed = z
  .object({
    title: z.string().max(256).optional(),
    description: z.string().max(4096).optional(),
    url: z.string().url().optional(),
    color: z.number().int().min(0).max(16777215).optional(),
    timestamp: z.string().optional(),
    footer: z.object({ text: z.string().max(2048), icon_url: z.string().url().optional() }).optional(),
    image: z.object({ url: z.string().url() }).optional(),
    thumbnail: z.object({ url: z.string().url() }).optional(),
    author: z.object({ name: z.string().max(256), url: z.string().url().optional(), icon_url: z.string().url().optional() }).optional(),
    fields: z.array(embedField).max(25).optional(),
  })
  .passthrough();

export const sendNotificationSchema = z
  .object({
    type: z.string().min(1).optional(),
    channelId: z.string().uuid().optional(),
    content: z.string().max(2000).optional(),
    embeds: z.array(embed).max(10).optional(),
    username: z.string().max(80).optional(),
    avatarUrl: z.string().url().optional(),
  })
  .refine((data) => Boolean(data.type) || Boolean(data.channelId), {
    message: "Informe type ou channelId.",
  })
  .refine((data) => Boolean(data.content) || (data.embeds !== undefined && data.embeds.length > 0), {
    message: "Informe content ou embeds.",
  });
