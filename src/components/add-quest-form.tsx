export const AddQuestForm = () => {
  let inputRef!: HTMLInputElement;

  const handleAddQuest = (e: Event) => {
    // TODO:
  };

  return (
    <form
      class="w-full rounded-t-sm border border-[#dedede] p-3 py-4 text-2xl shadow-inner"
      method="post"
      onSubmit={(e) => {
        if (!inputRef.value.trim()) {
          e.preventDefault();
        }
        handleAddQuest(e);
      }}
    >
      <input
        name="title"
        class="h-full w-full text-center"
        placeholder="Something need doing?"
        ref={inputRef}
        autofocus
      />
    </form>
  );
};
