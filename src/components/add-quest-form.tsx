export const AddQuestForm = () => {
  let inputRef!: HTMLInputElement;

  const handleAddQuest = () => {
    const title = inputRef.value;
    console.log(`Add Quest, ${title}`);
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
