import { commands } from "~/bindings";

interface Request {
  questId: string;
  completed: boolean;
}

export const setQuestCompleted = async (data: Request) => {
  await commands.updateQuest({
    id: data.questId,
    data: {
      completed: data.completed,
    },
  });
};
