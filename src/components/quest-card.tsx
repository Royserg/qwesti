import SquareIcon from "lucide-solid/icons/square";
import SquareCheckIcon from "lucide-solid/icons/square-check";
import {
	createEffect,
	createSignal,
	onCleanup,
	type Component,
} from "solid-js";
import { deleteQuest, setQuestCompleted } from "~/actions";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";

interface Props {
	quest: Quest;
}

export const QuestCard: Component<Props> = (props) => {
	let deleteConfirmTimeout: NodeJS.Timeout;
	const [deleteBtnPressed, setDeleteButtonPressed] = createSignal(false);
	const [deleteProgress, setDeleteProgress] = createSignal(0); // percent progress - bg gradient

	const handleQuestToggle = async () => {
		await setQuestCompleted({
			questId: props.quest.id,
			completed: !props.quest.completed,
		});
	};

	const handleDeleteQuest = async () => {
		await deleteQuest({ questId: props.quest.id });
	};

	const handleDeletePress = () => {
		setDeleteButtonPressed(true);

		deleteConfirmTimeout = setInterval(() => {
			console.log("setting progress");
			setDeleteProgress((prev) => {
				if (prev < 100) {
					return prev + 2;
				}
				return prev;
			});
		}, 20);
	};

	const handleDeleteRelease = () => {
		setDeleteButtonPressed(false);
		// Reset delete confirm progress
		clearTimeout(deleteConfirmTimeout);
		setDeleteProgress(0);
	};

	createEffect(() => {
		if (deleteProgress() >= 100) {
			handleDeleteQuest();
		}
	});

	onCleanup(() => {
		clearTimeout(deleteConfirmTimeout);
	});

	const deleteBtnLinearGradient = () => {
		return `linear-gradient(
		          0deg,
							var(--color-red-800) 0%,
							var(--color-red-800) ${deleteProgress()}%, var(--color-white) ${deleteProgress() + 2}%
						)`;
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

				<button
					type="button"
					onMouseDown={handleDeletePress}
					onMouseUp={handleDeleteRelease}
					style={{
						background: deleteBtnPressed()
							? deleteBtnLinearGradient()
							: "var(--color-red-300)",
					}}
					class="w-5 h-5 ml-auto cursor-pointer border-1"
				/>
			</CardContent>
		</Card>
	);
};
