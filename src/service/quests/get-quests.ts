import "reflect-metadata";
import { getInjection } from "~/core/di/container";
import { Quest } from "~/core/domain/models/quest";

export const getQuestsUseCase = async (): Promise<Quest[]> => {
  const questsRepository = getInjection("IQuestsRepository");

  const quests = await questsRepository.getQuests();
  return quests;
};
