import X from "icons/x";
import { type Component, onMount, type Setter } from "solid-js";
import type { DOMElement } from "solid-js/jsx-runtime";
import { Button } from "~/components/ui/button";

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
    const title = inputRef.value.trim();
    if (!title) {
      return;
    }

    await props.onSubmit(title);
    inputRef.value = "";
  };

  onMount(() => {
    inputRef.focus();
  });

  const handleDialogClick = (e: DialogClickEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();

    if (
      rect.left > e.clientX ||
      rect.right < e.clientX ||
      rect.top > e.clientY ||
      rect.bottom < e.clientY
    ) {
      props.onClose();
    }
  };

  return (
    <dialog onClick={handleDialogClick} ref={props.dialogRef} class="pixel-dialog">
      <div class="pixel-dialog__panel relative mx-auto">
        <button
          type="button"
          onClick={props.onClose}
          class="pixel-icon-button absolute right-4 top-4 z-10 size-10"
          aria-label="Close create task dialog"
        >
          <X />
        </button>

        <form
          class="flex flex-col gap-5 px-6 py-6 pt-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div class="flex flex-col gap-2 pr-12">
            <h4 class="type-pixel text-xl">create new task</h4>
            <p class="type-copy text-sm text-[var(--muted-color)]">
              add a new task for the current day or branch.
            </p>
          </div>

          <input
            autocomplete="off"
            autoCapitalize="off"
            autocorrect="off"
            name="title"
            class="pixel-field"
            placeholder="create new task"
            ref={inputRef}
            autofocus
          />

          <div class="flex justify-end">
            <Button type="submit" class="min-w-[160px]">
              add task
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
