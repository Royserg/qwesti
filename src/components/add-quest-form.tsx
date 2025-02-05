import { addQuest } from "~/actions";

export const AddQuestForm = () => {
	let inputRef!: HTMLInputElement;

	const handleAddQuest = async () => {
		const title = inputRef.value;

		try {
			await addQuest({ title });

			// clear input
			inputRef.value = "";
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<form
			class="focus-within:border-[#222] focus-within:shadow-inner w-[98%] mx-auto rounded-t-xs border border-[#dedede]  text-2xl"
			onSubmit={(e) => {
				e.preventDefault();
				if (!inputRef.value.trim()) {
					return;
				}
				handleAddQuest();
			}}
		>
			<input
				autocomplete="off"
				autoCapitalize="off"
				autocorrect="off"
				name="title"
				class="h-[65px] w-full outline-none p-3 py-4"
				placeholder="Something need doing?"
				ref={inputRef}
				autofocus
			/>
		</form>
	);
};
