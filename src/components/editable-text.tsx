import { type Accessor, type Component, createSignal, Show } from "solid-js";
import { cn } from "~/lib/utils";

interface Props {
	value: string;
	focusable: Accessor<boolean>;
}

export const EditableText: Component<Props> = (props) => {
	let textDisplay!: HTMLDivElement;
	let input!: HTMLInputElement;

	const [editEnabled, setEditEnabled] = createSignal(false);
	const [newValue, setNewValue] = createSignal(props.value);

	const handleKeyUp = (e: KeyboardEvent) => {
		e.stopPropagation();

		if (e.key === "Enter") {
			setEditEnabled(true);
			input.focus();
		}
	};
	const handleInputKeyUp = (e: KeyboardEvent) => {
		e.stopPropagation();

		if (e.key === "Escape") {
			setEditEnabled(false);
			textDisplay.focus();
		}
	};

	return (
		<>
			<Show when={!editEnabled()}>
				<div
					ref={textDisplay}
					class="w-full"
					tabIndex={props.focusable() ? 0 : -1}
					onKeyUp={handleKeyUp}
				>
					{props.value}
				</div>
			</Show>

			<input
				onKeyUp={handleInputKeyUp}
				ref={input}
				class={cn("w-full ", {
					hidden: !editEnabled(),
				})}
				value={newValue()}
			/>
		</>
	);
};
