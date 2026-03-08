import { commands, type QuestDescriptionAsset } from "~/bindings";

interface Request {
  file: File;
  questId?: string;
  draftId?: string;
}

export const uploadDescriptionImage = async (data: Request): Promise<QuestDescriptionAsset> => {
  const fileBytes = new Uint8Array(await data.file.arrayBuffer());

  const res = await commands.uploadDescriptionImage({
    quest_id: data.questId ?? null,
    draft_id: data.draftId ?? null,
    filename: data.file.name || null,
    mime_type: data.file.type,
    bytes: Array.from(fileBytes),
  });

  if (res.status === "error") {
    throw new Error(res.error);
  }

  return res.data;
};
