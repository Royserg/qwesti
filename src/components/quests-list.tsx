import { For, Match, Switch } from "solid-js";
import { match } from "ts-pattern";
import { useQuests } from "~/data/quests";
import { QuestCard } from "./quest-card";

export const QuestsList = () => {
	const query = useQuests();

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
							<For each={data}>{(item) => <QuestCard quest={item} />}</For>
						);
					})
					.otherwise(() => (
						<div>No quests</div>
					))}
			</Match>
		</Switch>
	);
};
