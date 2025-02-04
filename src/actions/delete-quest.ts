import { queryClient } from "~/.";
import { commands } from "~/bindings";
import { QUERY_KEY } from "~/data/quests";

interface Request {
	questId: string;
}

export const deleteQuest = async ({ questId }: Request) => {
	const res = await commands.deleteQuest({ id: questId });

	if (res.status === "ok") {
		queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
	}
};
