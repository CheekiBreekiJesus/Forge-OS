import { z } from "zod";

export const outreachMessageSendParamsSchema = z.object({
  messageId: z.string().min(1).max(128)
});

export const outreachMessageSendBodySchema = z.object({
  confirmation: z.literal("SEND SIMULATION").optional()
});

export const outreachGenerateBodySchema = z.object({
  leadId: z.string().min(1),
  campaignId: z.string().min(1),
  tone: z.enum(["professional", "friendly", "direct"]).optional(),
  productKeys: z.array(z.string()).optional(),
  locale: z.enum(["pt-PT", "en"]).optional()
});

export type OutreachMessageSendBody = z.infer<typeof outreachMessageSendBodySchema>;
