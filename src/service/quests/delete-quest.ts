import "reflect-metadata";
import { getInjection } from "~/core/di/container";

export const deleteQuestUseCase = async (input: {
  id: number;
}): Promise<void> => {
  const questsRepository = getInjection("IQuestsRepository");

  await questsRepository.deleteQuest(input.id);
};
