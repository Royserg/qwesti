import { commands } from "~/bindings";

interface Request {
  id: string;
}
export const loadQuest = async (data: Request) => {
  const res = await commands.getQuest(data.id);

  if (res.status === "error") {
    throw new Error(res.error);
  }

  return res.data;
};
