import { commands } from "~/bindings";
import { loadQuests } from "./get-quests";

interface Request {
  questId: string;
}

export const deleteQuest = async ({ questId }: Request) => {
  const res = await commands.deleteQuest({ id: questId });

  if (res.status === "ok") {
    await loadQuests();
  }
};
