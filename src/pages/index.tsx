import { createAutoAnimate } from "@formkit/auto-animate/solid";
import { RouteSectionProps } from "@solidjs/router";
import { createSignal } from "solid-js";
import { AddQuestDialog } from "~/components/add-quest-dialog";
import { QuestsList } from "~/components/quests-list";
import { TodayDate } from "~/components/today-date";
import { Button } from "~/components/ui/button";

export const Home = (_props: RouteSectionProps) => {
  const [parent] = createAutoAnimate();
  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>()

  const closeDialog = () => {
    dialogRef()?.close();
  }

  return (
    <main ref={parent} class="relative h-screen flex flex-col pt-2 ">
      <div class="py-2" />

      <TodayDate />

      <div class="py-4" />

      <AddQuestDialog
        dialogRef={setDialogRef}
        onClose={closeDialog}
        onQuestAdded={closeDialog}
      />

      <section class="flex flex-1 flex-col gap-1 overflow-hidden px-4">
        <QuestsList />
      </section>

      <section class="mt-auto flex h-[60px] w-full items-center justify-center border-t pb-1">
        <Button
          class="h-[50px] w-3/5 rounded-sm"
          onClick={() => {
            dialogRef()?.showModal();
          }}
        >
          Add
        </Button>
      </section>
    </main>
  );
};

export default Home;
