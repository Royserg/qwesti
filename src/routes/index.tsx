import { queryOptions, useQuery } from "@tanstack/solid-query";
import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { format } from "date-fns";
import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { z } from "zod";
import { addQuest, loadQuest, loadQuestsForDate, loadSubQuests, moveQuest } from "~/actions";
import type { Quest } from "~/bindings";
import { AddQuestDialog } from "~/components/add-quest-dialog/add-quest-dialog";
import { QuestsTree } from "~/components/quests-tree";
import { TodayDate } from "~/components/today-date";
import { Button } from "~/components/ui/button";
import {
  collectExpandableIds,
  recomputeTreeQuest,
  type TreeQuest,
} from "~/lib/quest-tree";
import { BaseLayout } from "~/layouts/base";
import { BE_DATE_FROMAT } from "~/stores/date";
import { queryClient } from "./__root";

export const QuestsFilterEnum = z.enum(["all", "pending", "completed"]);
export type QuestsFilterEnumType = z.infer<typeof QuestsFilterEnum>;
export const QuestsViewEnum = z.enum(["list", "tree"]);

const questsSearchSchema = z.object({
  filter: QuestsFilterEnum.default(QuestsFilterEnum.enum.all),
  view: QuestsViewEnum.optional(),
  // Navigating back from quest details would navigate to default view
  // so it doesn't show 1 day ago if it happens after midnight
  date: z.string().optional(),
});

const todayInFormat = () => format(new Date(), BE_DATE_FROMAT);

const areSetsEqual = (left: Set<string>, right: Set<string>) =>
  left.size === right.size && [...left].every((value) => right.has(value));

type QuestsSearch = z.infer<typeof questsSearchSchema>;

const buildQuestTree = async (
  quest: Quest,
  parentChain: Set<string>,
): Promise<TreeQuest> => {
  const baseQuest: TreeQuest = {
    ...quest,
    children: [],
    hasChildren: false,
    directCompleted: quest.completed,
  };

  if (parentChain.has(quest.id)) {
    return baseQuest;
  }

  const nextParentChain = new Set(parentChain);
  nextParentChain.add(quest.id);

  const subQuests = await loadSubQuests(quest.id);
  const safeSubQuests = subQuests.filter((subQuest) => !nextParentChain.has(subQuest.id));
  const children = await Promise.all(
    safeSubQuests.map((subQuest) => buildQuestTree(subQuest, nextParentChain)),
  );

  return recomputeTreeQuest({
    ...baseQuest,
    children,
  });
};

const loadQuestsTreeForDate = async (
  date: string,
  filter: QuestsSearch["filter"],
): Promise<TreeQuest[]> => {
  const rootQuests = await loadQuestsForDate(date, filter);

  return Promise.all(
    rootQuests.map(async (quest) => {
      const rootQuest = await loadQuest({ id: quest.id });
      return buildQuestTree(rootQuest, new Set<string>());
    }),
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
  loader: async ({ deps }) =>
    queryClient.ensureQueryData(questsTreeQueryOptions(deps.date ?? todayInFormat(), deps.filter)),
  gcTime: 0,
  shouldReload: false,
});

function Index() {
  const navigate = useNavigate({ from: "/" });
  const searchParams = Route.useSearch();
  const selectedDate = () => searchParams().date ?? todayInFormat();
  const selectedFilter = () => searchParams().filter;

  const questsTreeQuery = useQuery(() => questsTreeQueryOptions(selectedDate(), selectedFilter()));

  const [isAddDialogOpen, setIsAddDialogOpen] = createSignal(false);
  const [collapsedIds, setCollapsedIds] = createSignal<Set<string>>(new Set());
  let knownExpandableIds = new Set<string>();

  const isTodaySelected = () => !searchParams().date;
  const tree = () => questsTreeQuery.data ?? ([] as TreeQuest[]);

  createEffect(() => {
    const legacyView = searchParams().view;
    if (!legacyView) {
      return;
    }

    navigate({
      to: "/",
      search: (prev) => {
        const { view: _view, ...rest } = prev;
        return rest;
      },
      replace: true,
    });
  });

  const expandableIds = createMemo(() => new Set(collectExpandableIds(tree())));
  const hasExpandableTasks = createMemo(() => expandableIds().size > 0);
  const hasExpandedTasks = createMemo(() => {
    const ids = expandableIds();
    if (ids.size === 0) {
      return false;
    }

    return [...ids].some((id) => !collapsedIds().has(id));
  });

  createEffect(() => {
    const validIds = expandableIds();
    setCollapsedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));

      for (const id of validIds) {
        if (!knownExpandableIds.has(id)) {
          next.add(id);
        }
      }

      return areSetsEqual(prev, next) ? prev : next;
    });
    knownExpandableIds = new Set(validIds);
  });

  const refreshTree = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["quests"] }),
      queryClient.invalidateQueries({ queryKey: ["questsTree"] }),
      questsTreeQuery.refetch(),
    ]);
  };

  const handleAddQuest = async (title: string) => {
    try {
      await addQuest({ title });
      await refreshTree();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleQuestDeleted = async () => {
    await refreshTree();
  };

  const handleQuestToggled = async () => {
    await refreshTree();
  };

  const handleToggleNode = (questId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (!hasExpandableTasks()) {
      return;
    }

    setCollapsedIds(() => (hasExpandedTasks() ? new Set(expandableIds()) : new Set<string>()));
  };

  const handlePersistMoveQuest = async (questId: string, parentId: string | null, index: number) => {
    try {
      await moveQuest({
        questId,
        parentId,
        index,
      });
    } catch (err) {
      console.error(err);
    } finally {
      await refreshTree();
    }
  };

  return (
    <BaseLayout class="relative flex min-h-0 flex-col px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
      <TodayDate />

      <AddQuestDialog
        open={isAddDialogOpen()}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddQuest}
      />

      <section class="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
        <QuestsTree
          quests={tree()}
          filter={searchParams().filter}
          collapsedIds={collapsedIds()}
          hasExpandableTasks={hasExpandableTasks()}
          hasExpandedTasks={hasExpandedTasks()}
          onToggleAll={handleToggleAll}
          onToggleNode={handleToggleNode}
          onPersistMoveQuest={handlePersistMoveQuest}
          onQuestDeleted={handleQuestDeleted}
          onQuestToggled={handleQuestToggled}
        />
      </section>

      <Show when={isTodaySelected()}>
        <section
          style={{
            "view-transition-name": "bottom-bar",
          }}
          class="mt-4"
        >
          <Button
            class="pixel-button--action h-[60px] w-full"
            onClick={() => {
              setIsAddDialogOpen(true);
            }}
          >
            add
          </Button>
        </section>
      </Show>
    </BaseLayout>
  );
}
