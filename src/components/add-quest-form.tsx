import { type Component, onMount } from "solid-js";
import { addQuest } from "~/actions";
import { Button } from "~/components/ui/button";

interface Props {
  onQuestAdded: () => void;
}

export const AddQuestForm: Component<Props> = (props) => {
  let inputRef!: HTMLInputElement;

  const handleAddQuest = async () => {
    const title = inputRef.value.trim();
    if (!title) {
      return;
    }

    try {
      await addQuest({ title });
      inputRef.value = "";
      props.onQuestAdded();
    } catch (err) {
      console.error(err);
    }
  };

  onMount(() => {
    inputRef.focus();
  });

  return (
    <form
      class="pixel-dialog__panel mx-auto flex w-full flex-col gap-5 px-6 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleAddQuest();
      }}
    >
      <div class="flex flex-col gap-2">
        <h4 class="type-pixel text-xl">create new task</h4>
        <p class="text-sm text-[var(--muted-color)]">add a new task to today's list.</p>
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
  );
};
