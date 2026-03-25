import type { QuestDescriptionAsset } from "~/bindings";
import { uploadDescriptionAsset } from "./upload-description-asset";

interface Request {
  file: File;
  questId?: string;
  draftId?: string;
}

export const uploadDescriptionImage = async (data: Request): Promise<QuestDescriptionAsset> => {
  return uploadDescriptionAsset(data);
};
