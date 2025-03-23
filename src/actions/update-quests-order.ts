import { commands } from "~/bindings";

interface Request {
  ids: string[];
}

export const updateQuestsOrder = async (data: Request) => {
  const res = await commands.updateQuestsOrder({
    ids: data.ids
  });

  if (res.status === "error") {
    throw new Error(res.error);
  }

  return res.data;
};
