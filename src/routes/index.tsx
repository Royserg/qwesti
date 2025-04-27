import { queryOptions, useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link, useLoaderData, useRouter } from "@tanstack/solid-router";
import { format } from "date-fns";
import { createEffect, createSignal, For, Show } from "solid-js";
import { z } from "zod";
import { addQuest, loadQuests, loadQuestsForDate } from "~/actions";
import { AddQuestDialog } from "~/components/add-quest-dialog/add-quest-dialog";
import { QuestsList } from "~/components/quests-list";
import { TodayDate } from "~/components/today-date";
import { Button } from "~/components/ui/button";
import { BaseLayout } from "~/layouts/base";
import { getTodayDate } from "~/lib/date";
import { BE_DATE_FROMAT } from "~/stores/date";
import { queryClient } from "./__root";

export const QuestsFilterEnum = z.enum(["all", "pending", "completed"]);
export type QuestsFilterEnumType = z.infer<typeof QuestsFilterEnum>;

const questsSearchSchema = z.object({
  filter: QuestsFilterEnum.default(QuestsFilterEnum.enum.all),
  date: z.string().optional().default(format(new Date(), BE_DATE_FROMAT)),
});

type QuestsSearch = z.infer<typeof questsSearchSchema>;


const questsQueryOptions = (props: QuestsSearch) => queryOptions({
  queryKey: ['quests', props.date, props.filter],
  queryFn: () => loadQuestsForDate(props.date, props.filter),
})

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: questsSearchSchema,
  loaderDeps: ({ search: { date, filter } }) => ({ date, filter }),
  loader: async ({ deps }) => {
    await queryClient.ensureQueryData(questsQueryOptions({ date: deps.date, filter: deps.filter }))
    // return queryClient.ensureQueryData(questsQueryOptions({ date: deps.date, filter: deps.filter }))
    return await loadQuestsForDate(deps.date, deps.filter)
  },

  // Needed to reload data when using `history.back()` call
  // Do not cache this route's data after it's unloaded
  // gcTime: 0,
  // Only reload the route when the user navigates to it or when deps change
  // shouldReload: false,
});

function Index() {
  const searchParams = Route.useSearch();
  // const questsQuery = useQuery(() => questsQueryOptions({ date: searchParams().date, filter: searchParams().filter }));
  const data = Route.useLoaderData();
  const questsQuery = useQuery(() => ({
    queryKey: ['quests', searchParams().date, searchParams().filter],
    queryFn: () => loadQuestsForDate(searchParams().date, searchParams().filter),
    initialData: data()
  }));

  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

  const isTodaySelected = () => {
    return searchParams().date === getTodayDate();
  };

  const closeDialog = () => {
    dialogRef()?.close();
  };

  const handleAddQuest = async (title: string) => {
    try {
      await addQuest({ title });
      closeDialog();
      questsQuery.refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuestDeleted = () => {
    questsQuery.refetch();
  };

  const handleQuestToggled = () => {
    questsQuery.refetch();
  }

  const onOrderChanged = () => {
    questsQuery.refetch();
  }

  return (
    <BaseLayout class="relative flex flex-col pt-2">
      <div class="py-2" />

      <TodayDate />

      <div class="py-4" />

      <AddQuestDialog
        dialogRef={setDialogRef}
        onSubmit={handleAddQuest}
        onClose={closeDialog}
      />

      <section class="flex flex-1 flex-col gap-1 overflow-hidden px-4">
        <QuestsList
          quests={questsQuery.data ?? []}
          filter={searchParams().filter}
          onQuestDeleted={handleQuestDeleted}
          onQuestToggled={handleQuestToggled}
          onOrderChanged={onOrderChanged}
        />

        {/* TODO: check view transitions */}
        {/* <ul class="flex flex-col"> */}
        {/*   <For each={questsQuery.data}> */}
        {/*     {(q) => ( */}
        {/*       <Link */}
        {/*         to="/quests/$questId" params={{ questId: q.id }} */}
        {/*         class="border p-2 rounded-lg" */}
        {/*         style={{ */}
        {/*           "view-transition-name": `quest-${q.id}`, */}
        {/*           contain: "layout", */}
        {/*         }} */}
        {/*       > */}
        {/*         {q.title} */}
        {/*       </Link> */}
        {/*     )} */}
        {/*   </For> */}
        {/* </ul> */}
      </section>

      <Show when={isTodaySelected()}>
        <section
          style={{
            "view-transition-name": "bottom-bar",
          }}
          class="bg-background animate-in slide-in-from-bottom-5 mt-auto flex h-[70px] w-full items-center justify-center border-t pb-1 rounded-t-xs"
        >
          <Button
            class="h-[50px] w-3/5 rounded-xs"
            onClick={() => {
              dialogRef()?.showModal();
            }}
          >
            Add
          </Button>
        </section>
      </Show>
    </BaseLayout>
  );
}
