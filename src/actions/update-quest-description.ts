import { commands } from "~/bindings";
import { loadQuests } from "./get-quests";

interface Request {
  questId: string;
  description: string;
}

export const updateQuestDescription = async (data: Request) => {
  const res = await commands.updateQuest({
    id: data.questId,
    data: {
      description: data.description,
    },
  });

  if (res.status === "error") {
    throw new Error(res.error);
  }
  if (res.status === "ok") {
    await loadQuests();
  }

  return res.data;
};
