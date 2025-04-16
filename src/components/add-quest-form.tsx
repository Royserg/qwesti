import { Component, onMount } from "solid-js";
import { addQuest } from "~/actions";

interface Props {
  onQuestAdded: () => void;
}
export const AddQuestForm: Component<Props> = (props) => {
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
  );
};
