import { Square, SquareCheck } from "lucide-solid";
import type { Component } from "solid-js";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";

interface Props {
	quest: Quest;
}

export const QuestCard: Component<Props> = (props) => {
	const handleQuestToggle = () => {
		// TODO: toggle command
	};

	return (
		<Card class="h-full">
			<CardContent class="flex gap-6 justify-start align-middle p-2">
				<button
					type="button"
					class="cursor-pointer flex justify-center"
					onClick={handleQuestToggle}
				>
					{props.quest.completed ? <SquareCheck /> : <Square />}
				</button>

				<h5>{props.quest.title}</h5>
			</CardContent>
		</Card>
	);
};
