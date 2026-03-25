import { commands } from "~/bindings";
import { loadQuests } from "./get-quests";

interface Request {
  title: string;
  parentId?: string;
  description?: string;
  descriptionDraftId?: string;
}

// NOTE: currently adds quest to 'Today' date
export const addQuest = async (data: Request) => {
  const res = await commands.addQuest({
    title: data.title,
    parent_id: data.parentId ?? null,
    description: data.description ?? null,
    description_draft_id: data.descriptionDraftId ?? null,
  });

  if (res.status === "error") {
    throw new Error(res.error);
  }

  if (res.status === "ok") {
    await loadQuests();
  }

  return res.data;
};
