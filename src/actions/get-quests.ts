import { query } from "@solidjs/router";
import { commands } from "~/bindings";

export const getQuests = query(async () => {
	const res = await commands.getQuests();
	if (res.status === "error") {
		throw new Error(res.error);
	}

	return res.data;
}, "loadQuests");
