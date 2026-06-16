import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1),
  telegramBotToken: z.string().min(1),
  telegramChatId: z.string().min(1),
});

export const projectUpdateSchema = z
  .object({
    name: z.string().min(1),
    telegramBotToken: z.string().min(1),
    telegramChatId: z.string().min(1),
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });
