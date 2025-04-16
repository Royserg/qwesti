import { z } from "zod";

export const questSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});
export type Quest = z.infer<typeof questSchema>;

export const insertQuestSchema = questSchema.pick({
  title: true,
  completed: true,
});
export type QuestInsert = z.infer<typeof insertQuestSchema>;
