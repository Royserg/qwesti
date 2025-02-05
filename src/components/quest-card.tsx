import SquareIcon from "lucide-solid/icons/square";
import SquareCheckIcon from "lucide-solid/icons/square-check";
import { createSignal, type Component } from "solid-js";
import { deleteQuest, setQuestCompleted } from "~/actions";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { DeleteButton } from "./delete-button";

type FocusOutEvent = FocusEvent & {
	currentTarget: HTMLDivElement;
	target: Element;
};

interface Props {
	quest: Quest;
}

export const QuestCard: Component<Props> = (props) => {
	const [selected, setSelected] = createSignal(false);

	const handleQuestToggle = async () => {
		await setQuestCompleted({
			questId: props.quest.id,
			completed: !props.quest.completed,
		});
	};

	const handleDeleteQuest = async () => {
		await deleteQuest({ questId: props.quest.id });
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		// enable children to be focusable
		if (event.key === "Enter") {
			setSelected(true);
		}
	};

	let cardRef!: HTMLDivElement;
	const handleFocusOut = (e: FocusOutEvent) => {
		if (!e.relatedTarget) {
			return;
		}

		if (!cardRef.contains(e.relatedTarget as Node)) {
			setSelected(false);
		}
	};

	return (
		<Card
			ref={cardRef}
			class={cn("h-full", {
				"bg-gray-100": selected(),
			})}
			tabIndex={0}
			onKeyDown={handleKeyDown}
			onFocusOut={handleFocusOut}
		>
			<CardContent class="flex gap-6 justify-start align-middle p-3 pr-5">
				<button
					tabIndex={selected() ? 0 : -1}
					type="button"
					class="cursor-pointer flex justify-center"
					onClick={handleQuestToggle}
				>
					{props.quest.completed ? <SquareCheckIcon /> : <SquareIcon />}
				</button>

				<h5>{props.quest.title}</h5>

				<DeleteButton
					tabIndex={selected() ? 0 : -1}
					onDelete={handleDeleteQuest}
				/>
			</CardContent>
		</Card>
	);
};
