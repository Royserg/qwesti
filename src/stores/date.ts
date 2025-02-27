import { addDays, isToday } from "date-fns";
import { createStore } from "solid-js/store";


export const BE_DATE_FROMAT = "yyyy-MM-dd";
export const FE_DATE_FORMAT = "dd / MM / yyyy";

const [store, setStore] = createStore({
  selectedDate: new Date(),
})

/**
 * Today's date by default
 */
export const selectedDate = () => store.selectedDate;

export const isTodaySelected = (): boolean => {
  return isToday(store.selectedDate)
}


export const changeToNextDay = () => {
  const newDate = addDays(store.selectedDate, 1);

  setStore({ selectedDate: newDate })
}

export const changeToPreviousDay = () => {
  const newDate = addDays(store.selectedDate, -1);

  setStore({ selectedDate: newDate })
}
