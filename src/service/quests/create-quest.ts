import { Quest } from "~/models/quest";

export const createQuestUseCase = async (input: {
  title: string;
}): Promise<Quest> => {
  // TODO: call command
  const newQuest = await questsRepository.createQuest({
    title: input.title,
    completed: false,
  });

  return newQuest;
};
