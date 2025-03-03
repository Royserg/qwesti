import { commands } from "~/bindings";
import { loadQuests } from "./get-quests";

interface Request {
  title: string;
}

// NOTE: currently adds quest to 'Today' date
export const addQuest = async (data: Request) => {
  const res = await commands.addQuest({
    title: data.title,
  });

  if (res.status === "ok") {
    await loadQuests();
  }
};
