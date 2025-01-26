import "reflect-metadata";
import { getInjection } from "~/core/di/container";
import { Quest } from "~/core/domain/models/quest";

export const updateQuestUseCase = async (input: {
  id: number;
  title: string;
}): Promise<Quest> => {
  const questsRepository = getInjection("IQuestsRepository");

  const updatedQuest = await questsRepository.updateQuest(input.id, {
    title: input.title,
  });

  return updatedQuest;
};
