import { queryOptions, useQuery } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { format } from "date-fns";
import { createSignal, Show } from "solid-js";
import { z } from "zod";
import { addQuest, loadQuestsForDate, loadSubQuests } from "~/actions";
import type { Quest } from "~/bindings";
import { AddQuestDialog } from "~/components/add-quest-dialog/add-quest-dialog";
import { QuestsList } from "~/components/quests-list";
import { QuestsTree } from "~/components/quests-tree";
import { TodayDate } from "~/components/today-date";
import { Button } from "~/components/ui/button";
import { BaseLayout } from "~/layouts/base";
import { BE_DATE_FROMAT } from "~/stores/date";
import { queryClient } from "./__root";

export const QuestsFilterEnum = z.enum(["all", "pending", "completed"]);
export type QuestsFilterEnumType = z.infer<typeof QuestsFilterEnum>;
export const QuestsViewEnum = z.enum(["list", "tree"]);
export type QuestsViewEnumType = z.infer<typeof QuestsViewEnum>;

const questsSearchSchema = z.object({
  filter: QuestsFilterEnum.default(QuestsFilterEnum.enum.all),
  view: QuestsViewEnum.default(QuestsViewEnum.enum.list),
  // Navigating back from quest details would navigate to default view
  // so it doesn't show 1 day ago if it happens after midnight
  date: z.string().optional(),
});

const todayInFormat = () => {
  return format(new Date(), BE_DATE_FROMAT);
}

type QuestsSearch = z.infer<typeof questsSearchSchema>;


const questsQueryOptions = (date: QuestsSearch['date'], filter: QuestsSearch['filter']) => queryOptions({
  queryKey: ['quests', date, filter],
  queryFn: () => loadQuestsForDate(date ?? todayInFormat(), filter),
  // staleTime: 10 * 1000, // 5 seconds
})

const buildQuestTree = async (
  quest: Quest,
  parentChain: Set<string>,
  seenQuestIds: Set<string>,
): Promise<Quest> => {
  if (parentChain.has(quest.id) || seenQuestIds.has(quest.id)) {
    return {
      ...quest,
      hasChildren: false,
      children: [],
    };
  }

  seenQuestIds.add(quest.id);
  const nextParentChain = new Set(parentChain);
  nextParentChain.add(quest.id);

  const subQuests = await loadSubQuests(quest.id);
  const safeSubQuests = subQuests.filter(
    (subQuest) => !nextParentChain.has(subQuest.id) && !seenQuestIds.has(subQuest.id),
  );
  const children: Quest[] = await Promise.all(
    safeSubQuests.map((subQuest) => buildQuestTree(subQuest, nextParentChain, seenQuestIds)),
  );

  return {
    ...quest,
    hasChildren: children.length > 0,
    children,
  };
};

const loadQuestsTreeForDate = async (
  date: string,
  filter: QuestsSearch["filter"],
): Promise<Quest[]> => {
  const rootQuests = await loadQuestsForDate(date, filter);
  const seenQuestIds = new Set<string>();
  return Promise.all(
    rootQuests.map((quest) => buildQuestTree(quest, new Set<string>(), seenQuestIds)),
  );
};

const questsTreeQueryOptions = (date: QuestsSearch["date"], filter: QuestsSearch["filter"]) =>
  queryOptions({
    queryKey: ["questsTree", date, filter],
    queryFn: () => loadQuestsTreeForDate(date ?? todayInFormat(), filter),
  });

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: questsSearchSchema,
  loaderDeps: ({ search: { date, filter, view } }) => ({ date, filter, view }),
  loader: async ({ deps }) => {
    if (deps.view === QuestsViewEnum.enum.tree) {
      return queryClient.ensureQueryData(questsTreeQueryOptions(deps.date ?? todayInFormat(), deps.filter));
    }

    return queryClient.ensureQueryData(questsQueryOptions(deps.date ?? todayInFormat(), deps.filter));
  },
  gcTime: 0,
  shouldReload: false,
});

function Index() {
  const searchParams = Route.useSearch();
  const selectedDate = () => searchParams().date ?? todayInFormat();
  const selectedFilter = () => searchParams().filter;
  const selectedView = () => searchParams().view;

  const questsQuery = useQuery(() => ({
    ...questsQueryOptions(selectedDate(), selectedFilter()),
    enabled: selectedView() === QuestsViewEnum.enum.list,
  }));
  const questsTreeQuery = useQuery(() => ({
    ...questsTreeQueryOptions(selectedDate(), selectedFilter()),
    enabled: selectedView() === QuestsViewEnum.enum.tree,
  }));

  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

  const isTodaySelected = () => {
    return !searchParams().date;
  };

  const closeDialog = () => {
    dialogRef()?.close();
  };

  const refreshViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["quests"] }),
      queryClient.invalidateQueries({ queryKey: ["questsTree"] }),
      questsQuery.refetch(),
      questsTreeQuery.refetch(),
    ]);
  };

  const handleAddQuest = async (title: string) => {
    try {
      await addQuest({ title });
      closeDialog();
      await refreshViews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuestDeleted = async () => {
    await refreshViews();
  };

  const handleQuestToggled = async () => {
    await refreshViews();
  }

  const onOrderChanged = async () => {
    await refreshViews();
  }

  return (
    <BaseLayout class="relative flex flex-col pt-2">
      <div class="py-2" />

      <TodayDate />

      <div class="py-2" />

      <AddQuestDialog
        dialogRef={setDialogRef}
        onSubmit={handleAddQuest}
        onClose={closeDialog}
      />

      <section class="flex flex-1 flex-col gap-1 overflow-hidden px-4">
        <Show
          when={selectedView() === QuestsViewEnum.enum.tree}
          fallback={
            <QuestsList
              quests={questsQuery.data ?? []}
              filter={searchParams().filter}
              onQuestDeleted={handleQuestDeleted}
              onQuestToggled={handleQuestToggled}
              onOrderChanged={onOrderChanged}
            />
          }
        >
          <QuestsTree
            quests={questsTreeQuery.data ?? []}
            filter={searchParams().filter}
          />
        </Show>
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
