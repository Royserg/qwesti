import { createEffect, type Accessor, type Component, createSignal, Show } from "solid-js";
import { cn } from "~/lib/utils";

interface Props {
  value: string;
  focusable: Accessor<boolean>;
  onSubmit: (value: string) => Promise<void>;
  class?: string;
  inputClass?: string;
}

export const EditableText: Component<Props> = (props) => {
  let textDisplay!: HTMLDivElement;
  let input!: HTMLInputElement;

  const [editEnabled, setEditEnabled] = createSignal(false);
  const [newValue, setNewValue] = createSignal(props.value);

  createEffect(() => {
    setNewValue(props.value);
  });

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      setEditEnabled(true);
      input.focus();
    }
  };

  const handleSubmit = async () => {
    if (newValue() !== props.value) {
      // Prevent empty string
      if (newValue().trim().length > 0) {
        try {
          await props.onSubmit(newValue());
          setNewValue(props.value)
          setEditEnabled(false);
          textDisplay.focus();
        } catch (err) {
          console.error(err);
        }
      } else {
        // reset form value
        setNewValue(props.value);
      }
    }
  };

  const handleInputKeyUp = async (e: KeyboardEvent) => {
    e.stopPropagation();

    // submit change
    if (e.key === "Enter") {
      handleSubmit();
    }
    if (e.key === "Escape") {
      // reset
      setEditEnabled(false);
      textDisplay.focus();
    }
  };

  return (
    <>
      <Show when={!editEnabled()}>
        <div
          onClick={() => {
            setEditEnabled(true)
            setNewValue(props.value)
            input.focus();
          }}
          ref={textDisplay}
          class={cn("w-full", props.class)}
          tabIndex={props.focusable() ? 0 : -1}
          onKeyUp={handleKeyUp}
        >
          {props.value}
        </div>
      </Show>

      <Show when={editEnabled()}>
        <input
          onKeyUp={handleInputKeyUp}
          onBlur={() => {
            handleSubmit();
            setEditEnabled(false);
          }}
          ref={input}
          class={cn(
            "pixel-field w-full",
            props.class,
            props.inputClass,
            {
              hidden: !editEnabled(),
            },
          )}
          onInput={(e) => setNewValue(e.currentTarget.value)}
          value={newValue()}
        />
      </Show >

    </>
  );
};
