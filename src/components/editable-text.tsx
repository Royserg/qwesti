import { type Accessor, type Component, createSignal, Show } from "solid-js";
import { cn } from "~/lib/utils";

interface Props {
	value: string;
	focusable: Accessor<boolean>;
	onSubmit: (value: string) => Promise<void>;
}

export const EditableText: Component<Props> = (props) => {
	let textDisplay!: HTMLDivElement;
	let input!: HTMLInputElement;

	const [editEnabled, setEditEnabled] = createSignal(false);
	const [newValue, setNewValue] = createSignal(props.value);

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.stopPropagation();
			setEditEnabled(true);
			input.focus();
		}
	};

	const handleInputKeyUp = async (e: KeyboardEvent) => {
		e.stopPropagation();

		// submit change
		if (e.key === "Enter") {
			if (newValue() !== props.value) {
				// Prevent empty string
				if (newValue().trim().length > 0) {
					try {
						await props.onSubmit(newValue());
						setEditEnabled(false);
						textDisplay.focus();
					} catch (err) {
						console.error(err);
					}
				}
			}
		}
		if (e.key === "Escape") {
			// reset
			setNewValue(props.value);
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
				onInput={(e) => setNewValue(e.currentTarget.value)}
				value={newValue()}
			/>
		</>
	);
};
