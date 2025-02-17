import { query } from "@solidjs/router";
import { commands } from "~/bindings";

interface Request {
  date: string;
}
export const getQuests = query(async (data: Request) => {
  const res = await commands.getQuests(data.date);

  if (res.status === "error") {
    throw new Error(res.error);
  }

  return res.data;
}, "loadQuests");
