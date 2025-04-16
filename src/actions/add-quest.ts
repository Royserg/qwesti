import { commands } from "~/bindings";
import { loadQuests } from "./get-quests";

interface Request {
  title: string;
  parentId?: string;
}

// NOTE: currently adds quest to 'Today' date
export const addQuest = async (data: Request) => {
  const res = await commands.addQuest({
    title: data.title,
    parent_id: data.parentId ?? null,
  });

  if (res.status === "ok") {
    await loadQuests();
  }
};
