import { commands } from "~/bindings";
import { selectedDateBEFormat } from "~/stores/date";
import { setStore } from "~/stores/quests";

interface Request {
  date: string;
}
export const loadQuests = async () => {
  const dateString = selectedDateBEFormat();
  const res = await commands.getQuests(dateString);

  if (res.status === "error") {
    throw new Error(res.error);
  }

  setStore(dateString, res.data)

  return res.data;
};

export const loadQuestsForDate = async (dateString: string) => {
  const res = await commands.getQuests(dateString);

  if (res.status === "error") {
    throw new Error(res.error);
  }

  setStore(dateString, res.data)

  return res.data;
}
