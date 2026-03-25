import { commands } from "~/bindings";

interface Request {
  draftId: string;
}

export const discardDescriptionDraft = async (data: Request) => {
  const res = await commands.discardDescriptionDraft({
    draft_id: data.draftId,
  });

  if (res.status === "error") {
    throw new Error(res.error);
  }
};
