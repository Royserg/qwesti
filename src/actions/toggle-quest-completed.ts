import { commands } from "~/bindings";

interface Request {
	questId: string;
	completed: boolean;
}

export const toggleQuestCompleted = async (data: Request) => {
	await commands.updateQuest({
		id: data.questId,
		data: {
			completed: data.completed,
		},
	});
};
