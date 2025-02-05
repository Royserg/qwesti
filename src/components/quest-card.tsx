import SquareIcon from "lucide-solid/icons/square";
import SquareCheckIcon from "lucide-solid/icons/square-check";
import type { Component } from "solid-js";
import { deleteQuest, setQuestCompleted } from "~/actions";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";
import { DeleteButton } from "./delete-button";

interface Props {
	quest: Quest;
}

export const QuestCard: Component<Props> = (props) => {
	const handleQuestToggle = async () => {
		await setQuestCompleted({
			questId: props.quest.id,
			completed: !props.quest.completed,
		});
	};

	const handleDeleteQuest = async () => {
		await deleteQuest({ questId: props.quest.id });
	};

	return (
		<Card class="h-full">
			<CardContent class="flex gap-6 justify-start align-middle p-3 pr-5">
				<button
					type="button"
					class="cursor-pointer flex justify-center"
					onClick={handleQuestToggle}
				>
					{props.quest.completed ? <SquareCheckIcon /> : <SquareIcon />}
				</button>

				<h5>{props.quest.title}</h5>

				<DeleteButton onDelete={handleDeleteQuest} />
			</CardContent>
		</Card>
	);
};
