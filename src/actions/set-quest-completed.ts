import { queryClient } from "~/.";
import { commands } from "~/bindings";
import { QUERY_KEY } from "~/data/quests";

interface Request {
	questId: string;
	completed: boolean;
}

export const setQuestCompleted = async (data: Request) => {
	const res = await commands.updateQuest({
		id: data.questId,
		data: {
			completed: data.completed,
		},
	});

	if (res.status === "ok") {
		queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
	}
};
