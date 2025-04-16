import { Component, onMount, Setter } from "solid-js";
import { DOMElement } from "solid-js/jsx-runtime";

type DialogClickEvent = MouseEvent & {
  currentTarget: HTMLDialogElement;
  target: DOMElement;
};

interface Props {
  dialogRef: Setter<HTMLDialogElement | undefined>;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}
export const AddQuestDialog: Component<Props> = (props) => {
  let inputRef!: HTMLInputElement;


  const handleSubmit = async () => {
    const title = inputRef.value;
    await props.onSubmit(title)

    // clear input
    inputRef.value = "";
  }

  onMount(() => {
    inputRef.focus();
  })

  // Closes dialog when backdrop is clicked
  const handleDialogClick = (e: DialogClickEvent) => {
    let rect = e.target.getBoundingClientRect();

    if (rect.left > e.clientX ||
      rect.right < e.clientX ||
      rect.top > e.clientY ||
      rect.bottom < e.clientY
    ) {
      props.onClose()
    }
  }

  return (
    <dialog onClick={handleDialogClick} ref={props.dialogRef} class={`w-full overflow-hidden backdrop:bg-black/70 max-w-full animate-in slide-in-from-top-36 duration-300`}>
      <button onClick={props.onClose} class="absolute right-5 top-3 cursor-pointer rounded-xs border-2 px-2 grid place-items-center">X</button>

      <form
        class="w-full mx-auto rounded-t-xs bg-background text-2xl py-8 border-b px-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!inputRef.value.trim()) {
            return;
          }
          handleSubmit();
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

