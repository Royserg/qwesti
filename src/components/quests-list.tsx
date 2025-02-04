import { createQuery } from "@tanstack/solid-query";
import { For, Match, Switch } from "solid-js";
import { match } from "ts-pattern";
import { commands } from "~/bindings";
import { QuestCard } from "./quest-card";

export const QuestsList = () => {
	const query = createQuery(() => ({
		queryKey: ["quests"],
		queryFn: async () => commands.getQuests(),
		throwOnError: true,
	}));

	const revalidateQuests = () => {
		query.refetch();
	};

	return (
		<Switch>
			<Match when={query.isLoading}>
				<div>Loading...</div>
			</Match>
			<Match when={query.isSuccess}>
				{match(query.data)
					.with({ status: "error" }, ({ error }) => <div>error: {error}</div>)
					.with({ status: "ok" }, ({ data }) => {
						return (
							<For each={data}>
								{(item) => (
									<QuestCard quest={item} onQuestUpdated={revalidateQuests} />
								)}
							</For>
						);
					})
					.otherwise(() => (
						<div>No quests</div>
					))}
			</Match>
		</Switch>
	);
};
