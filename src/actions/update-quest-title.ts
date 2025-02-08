import { commands } from "~/bindings";

interface Request {
	questId: string;
	title: string;
}

export const updateQuestTitle = async (data: Request) => {
	const res = await commands.updateQuest({
		id: data.questId,
		data: {
			title: data.title,
		},
	});

	if (res.status === "error") {
		throw new Error(res.error);
	}

	return res.data;
};
