import { query } from "@solidjs/router";
import { format } from "date-fns";
import { commands } from "~/bindings";
import { BE_DATE_FROMAT, selectedDate } from "~/stores/date";

interface Request {
  date: string;
}
export const getQuests = query(async () => {
  const date = format(selectedDate(), BE_DATE_FROMAT);

  const res = await commands.getQuests(date);

  if (res.status === "error") {
    throw new Error(res.error);
  }

  return res.data;
}, "loadQuests");

export const loadQuestsForDate = async (dateString: string) => {
  const res = await commands.getQuests(dateString);

  if (res.status === "error") {
    throw new Error(res.error);
  }

  return res.data;
}
