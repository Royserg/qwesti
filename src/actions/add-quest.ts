import { revalidate } from "@solidjs/router";
import { commands } from "~/bindings";
import { getQuests } from "./get-quests";

interface Request {
	title: string;
}

export const addQuest = async (data: Request) => {
	const res = await commands.addQuest({
		title: data.title,
	});

	if (res.status === "ok") {
		revalidate(getQuests.key);
	}
};
