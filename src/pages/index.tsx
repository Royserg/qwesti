import { createAutoAnimate } from "@formkit/auto-animate/solid";
import { RouteSectionProps } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { AddQuestForm } from "~/components/add-quest-form";
// import { AddQuestForm } from "~/components/add-quest-form";
import { QuestsList } from "~/components/quests-list";
import { TodayDate } from "~/components/today-date";
import { Button } from "~/components/ui/button";

export const Home = (_props: RouteSectionProps) => {
  const [parent] = createAutoAnimate();
  const [showCreateQuestForm, setShowCreateQuestForm] = createSignal(false);

  return (
    <main ref={parent} class="relative flex h-screen flex-col pt-2">
      <div class="py-2" />

      <TodayDate />

      <div class="py-4" />

      <Show when={showCreateQuestForm()}>
        <section class="absolute top-0 h-full w-full z-50 overflow-hidden">
          <AddQuestForm onQuestAdded={() => setShowCreateQuestForm(false)} />
          <div class="h-full bg-black/70 ">
            {/* backdrop */}
          </div>
        </section>
      </Show>

      {/* TODO: should take % of entire height 
        scrollable rest 
      */}
      <section class="flex flex-1 flex-col gap-1 overflow-hidden px-4">
        <QuestsList />
      </section>

      <section class="mt-auto flex h-[60px] w-full items-center justify-center border-t pb-1">
        <Button
          class="h-[50px] w-3/5 rounded-sm"
          onClick={() => {
            console.log("clicked");
            setShowCreateQuestForm((prev) => !prev);
          }}
        >
          Add
        </Button>
      </section>
    </main>
  );
};

export default Home;
