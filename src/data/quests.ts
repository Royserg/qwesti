import { createQuery, queryOptions } from "@tanstack/solid-query";
import { getQuests } from "~/actions";

export const QUERY_KEY = "quests";

export const opts = () => {
  return queryOptions({
    queryKey: [QUERY_KEY],
    queryFn: getQuests,
    throwOnError: true,
  })
}

export const useQuests = () => {
  return createQuery(() => opts());
};
