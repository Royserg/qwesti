import { Quest } from "~/models/quest";

export const toggleQuestCompletedUseCase = async (input: {
  id: number;
}): Promise<Quest> => {
  const updatedQuest = await questsRepository.toggleQuestCompleted(input.id);

  return updatedQuest;
};
