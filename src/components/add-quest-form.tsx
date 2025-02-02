import type { Component } from "solid-js";
import { commands } from "~/bindings";

interface Props {
	onQuestAdded: () => void;
}

export const AddQuestForm: Component<Props> = (props) => {
	let inputRef!: HTMLInputElement;

	const handleAddQuest = async () => {
		const title = inputRef.value;

		try {
			await commands.addQuest({
				title,
			});
			props.onQuestAdded();
			// clear input
			inputRef.value = "";
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<form
			class="w-full rounded-t-xs border border-[#dedede] p-3 py-4 text-2xl"
			onSubmit={(e) => {
				e.preventDefault();
				if (!inputRef.value.trim()) {
					return;
				}
				handleAddQuest();
			}}
		>
			<input
				name="title"
				class="h-full w-full text-center outline-none"
				placeholder="Something need doing?"
				ref={inputRef}
				autofocus
			/>
		</form>
	);
};
