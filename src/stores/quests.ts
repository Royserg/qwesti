import { format } from "date-fns";
import { createStore } from "solid-js/store";
import { loadQuests } from "~/actions";
import { Quest } from "~/bindings";
import { BE_DATE_FROMAT, selectedDate } from "./date";

interface QuestStore {
  [dateBEFormat: string]: Quest[];
}

export const [store, setStore] = createStore<QuestStore>({
  [format(selectedDate(), BE_DATE_FROMAT)]: []
})

export const initStore = async () => {
  const today = new Date();
  const todayString = format(today, BE_DATE_FROMAT);

  const quests = await loadQuests();

  setStore(todayString, quests.length > 0 ? quests : []);
}

export const getQuestsForDate = (date: Date) => {
  console.log('get quests for date', date);
  const dateString = format(date, BE_DATE_FROMAT);
  const quests = store[dateString]

  console.log('QUESTS from store:', quests);

  return quests
}


