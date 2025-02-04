import { createQuery } from "@tanstack/solid-query";
import { getQuests } from "~/actions";

export const QUERY_KEY = "quests";

export const useQuests = () => {
	return createQuery(() => ({
		queryKey: [QUERY_KEY],
		queryFn: getQuests,
		throwOnError: true,
	}));
};
