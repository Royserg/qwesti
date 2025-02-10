import { RouteSectionProps } from "@solidjs/router";
import { AddQuestForm } from "~/components/add-quest-form";
import { QuestsList } from "~/components/quests-list";
import { TodayDate } from "~/components/today-date";

export const Home = (props: RouteSectionProps) => {
  const location = props.location;

  return (
    <main class="py-2">
      <TodayDate />

      <div class="py-1" />

      <div class="flex flex-col gap-2">
        <section class="my-2 px-4">
          <AddQuestForm />
        </section>

        <section class="flex flex-col gap-1 px-4">
          <QuestsList location={location} />
        </section>
      </div>
    </main>
  );
};
export default Home;
