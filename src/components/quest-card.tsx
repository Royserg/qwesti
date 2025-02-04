import SquareIcon from "lucide-solid/icons/square";
import SquareCheckIcon from "lucide-solid/icons/square-check";
import type { Component } from "solid-js";
import { toggleQuestCompleted } from "~/actions";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";

interface Props {
	quest: Quest;
	onQuestUpdated: () => void;
}

export const QuestCard: Component<Props> = (props) => {
	const handleQuestToggle = async () => {
		await toggleQuestCompleted({
			questId: props.quest.id,
			completed: !props.quest.completed,
		});
		props.onQuestUpdated();
	};

	return (
		<Card class="h-full">
			<CardContent class="flex gap-6 justify-start align-middle p-2">
				<button
					type="button"
					class="cursor-pointer flex justify-center"
					onClick={handleQuestToggle}
				>
					{props.quest.completed ? <SquareCheckIcon /> : <SquareIcon />}
				</button>

				<h5>{props.quest.title}</h5>
			</CardContent>
		</Card>
	);
};
