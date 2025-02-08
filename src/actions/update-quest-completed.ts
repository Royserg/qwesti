import { commands } from "~/bindings";

interface Request {
	questId: string;
	completed: boolean;
}

export const updateQuestCompleted = async (data: Request) => {
	const res = await commands.updateQuest({
		id: data.questId,
		data: {
			completed: data.completed,
		},
	});

	if (res.status === "error") {
		throw new Error(res.error);
	}

	return res.data;
};
