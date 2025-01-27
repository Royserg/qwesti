import { Card, CardContent } from "~/components/ui/card";
import { A } from "../router";
import { Button } from "~/components/ui/button";
import { TodayDate } from "~/components/today-date";
import { AddQuestForm } from "~/components/add-quest-form";

const Home = () => {
  return (
    <main class="h-screen w-full">
      <TodayDate />

      <div class="flex flex-col gap-2">
        <section class="my-2 px-4">
          <AddQuestForm />
        </section>

        <section class="flex flex-col gap-1 px-4">
          <Card>
            <CardContent>Quest 1</CardContent>
          </Card>

          <Card>
            <CardContent>Quest 2</CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default Home;

// <div>
// <div class="py-4" />

// <TodayDate />

// <div class="py-4" />

// <section class="max-w-[700px] mx-auto">
//   <header class="bg-white shadow-lg">
//     <AddQuestForm />
//   </header>

//   <div class="py-2" />

//   {/* Filters */}
//   <section ref={parent} class="main ">
//     <Show when={quests().length || createQuestSubmission.length}>
//       <div class="flex justify-end w-full">
//         <Filters location={location} />
//       </div>
//     </Show>

//     {/* Quest List */}
//     <ul ref={list} class="todo-list ">
//       <For each={filterList(quests())}>
//         {(quest) => <QuestItem quest={quest} />}
//       </For>
//     </ul>
//   </section>
// </section>

// <a href="/details" class="p-3 border rounded-sm">
//   Details page
// </a>
// </div>
