import { Component, onMount, Setter } from "solid-js";
import { addQuest } from "~/actions";

interface Props {
  dialogRef: Setter<HTMLDialogElement | undefined>;
  onClose: () => void;
  onQuestAdded: () => void;
}
export const AddQuestDialog: Component<Props> = (props) => {
  let inputRef!: HTMLInputElement;

  const handleAddQuest = async () => {
    const title = inputRef.value;

    try {
      await addQuest({ title });

      // clear input
      inputRef.value = "";
      props.onQuestAdded();
    } catch (err) {
      console.error(err);
    }
  };

  onMount(() => {
    inputRef.focus();
  })

  return (
    <dialog ref={props.dialogRef} class="w-full overflow-hidden backdrop:bg-black/70 max-w-full">
      <button onClick={props.onClose} class="absolute right-5 top-3 cursor-pointer rounded-xs border-2 px-2 grid place-items-center">X</button>

      <form
        class="w-full mx-auto rounded-t-xs bg-background text-2xl py-8 border-b px-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!inputRef.value.trim()) {
            return;
          }
          handleAddQuest();
        }}
      >
        <h4 class="text-center text-3xl pb-2">Create quest</h4>
        <input
          autocomplete="off"
          autoCapitalize="off"
          autocorrect="off"
          name="title"
          class="h-[65px] w-full outline-none p-3 py-4 focus-within:border-[#222] focus-within:shadow-inner border-[#dedede] border"
          placeholder="Quest..."
          ref={inputRef}
          autofocus
        />
      </form>
    </dialog>
  );
};

