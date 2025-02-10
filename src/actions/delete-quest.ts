import { revalidate } from "@solidjs/router";
import { commands } from "~/bindings";
import { getQuests } from "./get-quests";

interface Request {
	questId: string;
}

export const deleteQuest = async ({ questId }: Request) => {
	const res = await commands.deleteQuest({ id: questId });

	if (res.status === "ok") {
		revalidate(getQuests.key);
	}
};
