import { RouteSectionProps } from "@solidjs/router";
import { createSignal } from "solid-js";
import { addQuest } from "~/actions";
import { AddQuestDialog } from "~/components/add-quest-dialog/add-quest-dialog";
import { QuestsList } from "~/components/quests-list";
import { TodayDate } from "~/components/today-date";
import { Button } from "~/components/ui/button";
import { BaseLayout } from "~/layouts/base";

export const Quests = (_props: RouteSectionProps) => {
  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>()

  const closeDialog = () => {
    dialogRef()?.close();
  }

  const handleAddQuest = async (title: string) => {
    try {
      await addQuest({ title });
      closeDialog();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <BaseLayout class="relative h-screen flex flex-col pt-2">
      <div class="py-2" />

      <TodayDate />

      <div class="py-4" />

      <AddQuestDialog
        dialogRef={setDialogRef}
        onSubmit={handleAddQuest}
        onClose={closeDialog}
      />

      <section class="flex flex-1 flex-col gap-1 overflow-hidden px-4">
        <QuestsList />
      </section>

      <section class="mt-auto flex h-[60px] w-full items-center justify-center border-t pb-1">
        <Button
          class="h-[50px] w-3/5 rounded-xs"
          onClick={() => {
            dialogRef()?.showModal();
          }}
        >
          Add
        </Button>
      </section>
    </BaseLayout>
  );
};

export default Quests;
