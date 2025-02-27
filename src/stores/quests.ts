import { createStore } from "solid-js/store";
import { Quest } from "~/bindings";
import { BE_DATE_FROMAT, selectedDate } from "./date";
import { format } from "date-fns";
import { getQuests } from "~/actions";

interface QuestStore {
  [dateBEFormat: string]: Quest[];
}

const [store, setStore] = createStore<QuestStore>({
  [format(selectedDate(), BE_DATE_FROMAT)]: []
})

export const initStore = async () => {
  const today = new Date();
  const todayString = format(today, BE_DATE_FROMAT);

  const quests = await getQuests();

  setStore(todayString, quests)
}

export const getQuestsForDate = (date: Date) => {
  const dateString = format(date, BE_DATE_FROMAT);

  return store[dateString];
}
