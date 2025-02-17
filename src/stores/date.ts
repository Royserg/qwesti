import { format, addDays } from "date-fns";
import { createStore } from "solid-js/store";


export const BE_DATE_FROMAT = "yyyy-MM-dd";
export const FE_DATE_FORMAT = "dd / MM / yyyy";

const [store, setStore] = createStore({
  selectedDate: new Date()
})

export const selectedDate = () => store.selectedDate;


export const changeToNextDay = () => {
  const newDate = addDays(store.selectedDate, 1);
  console.log('CHANGING TO NEXT DAY', newDate)

  setStore({ selectedDate: newDate })
}
export const changeToPreviousDay = () => {
  const newDate = addDays(store.selectedDate, -1);
  console.log('CHANGING TO PREV DAY', newDate)

  setStore({ selectedDate: newDate })
}
