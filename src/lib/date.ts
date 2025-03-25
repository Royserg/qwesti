import { format } from "date-fns";
import { BE_DATE_FROMAT } from "~/stores/date";

/**
  returns Today's date in ISO format
  year-month-day
*/
export const getTodayDate = () => {
  const today = format(new Date(), BE_DATE_FROMAT);
  return today;
}


/**
  returns date in ISO format
  year-month-day
*/
export const dateToString = (date: Date) => {
  return format(date, BE_DATE_FROMAT);
}
