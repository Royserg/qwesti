import { commands } from "~/bindings";

interface Request {
  questId: string;
  parentId: string | null;
  index: number;
}

export const moveQuest = async (data: Request) => {
  const res = await commands.moveQuest({
    id: data.questId,
    parent_id: data.parentId,
    index: data.index,
  });

  if (res.status === "error") {
    throw new Error(res.error);
  }

  return res.data;
};
