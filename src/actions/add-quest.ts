import { queryClient } from "~/.";
import { commands } from "~/bindings";
import { QUERY_KEY } from "~/data/quests";

interface Request {
	title: string;
}

export const addQuest = async (data: Request) => {
	const res = await commands.addQuest({
		title: data.title,
	});

	if (res.status === "ok") {
		queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
	}
};
