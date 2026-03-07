import { animations, insert } from "@formkit/drag-and-drop";
import { dragAndDrop } from "@formkit/drag-and-drop/solid";
import {
  queryOptions,
  useQuery,
} from "@tanstack/solid-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/solid-router";
import ChevronLeft from "icons/chevron-left";
import { Component, For, Match, Show, Switch, createSignal, onMount } from "solid-js";
import {
  addQuest,
  deleteQuest,
  loadQuest,
  loadSubQuests,
  updateQuestCompleted,
  updateQuestTitle,
} from "~/actions";
import { updateQuestsOrder } from "~/actions/update-quests-order";
import { Quest } from "~/bindings";
import { AddQuestDialog } from "~/components/add-quest-dialog/add-quest-dialog";
import { DeleteButton } from "~/components/delete-button";
import { EditableText } from "~/components/editable-text";
import { PixelTaskRow } from "~/components/pixel-task-row";
import { QuestCard } from "~/components/quest-card";
import { TaskStatusCell } from "~/components/task-status-cell";
import { Button } from "~/components/ui/button";
import { BaseLayout } from "~/layouts/base";
import { queryClient } from "./__root";

type BreadcrumbQuest = {
  id: string;
  title: string;
};

const questQueryOptions = (questId: string) => queryOptions({
  queryKey: ["quest", questId],
  queryFn: () => loadQuest({ id: questId }),
});

const subQuestsQueryOptions = (questId: string) => queryOptions({
  queryKey: ["subQuests", questId],
  queryFn: () => loadSubQuests(questId),
});

const breadcrumbsQueryOptions = (questId: string) => queryOptions({
  queryKey: ["questBreadcrumbs", questId],
  queryFn: async () => {
    const chain: BreadcrumbQuest[] = [];
    const seen = new Set<string>();
    let currentQuestId: string | null = questId;

    while (currentQuestId && !seen.has(currentQuestId)) {
      seen.add(currentQuestId);

      const quest = await loadQuest({ id: currentQuestId });
      chain.push({
        id: quest.id,
        title: quest.title,
      });

      currentQuestId = quest.parentId;
    }

    return chain.reverse();
  },
});

export const Route = createFileRoute("/quests/$questId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(questQueryOptions(params.questId));
    await queryClient.ensureQueryData(subQuestsQueryOptions(params.questId));
    await queryClient.ensureQueryData(breadcrumbsQueryOptions(params.questId));
  },
  gcTime: 0,
  shouldReload: false,
});

function RouteComponent() {
  const params = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate({ from: "/quests/$questId" });

  const questQuery = useQuery(() => questQueryOptions(params().questId));
  const subQuestsQuery = useQuery(() => subQuestsQueryOptions(params().questId));
  const breadcrumbsQuery = useQuery(() => breadcrumbsQueryOptions(params().questId));

  const [isAddDialogOpen, setIsAddDialogOpen] = createSignal(false);

  const handleBackClick = () => {
    queryClient.clear();

    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  const handleTitleChange = async (title: string) => {
    const questId = params().questId;
    if (!questId) {
      return;
    }

    try {
      await updateQuestTitle({ questId, title });
      await Promise.all([questQuery.refetch(), breadcrumbsQuery.refetch()]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async () => {
    const questId = params().questId;
    if (!questId) {
      return;
    }

    await deleteQuest({ questId });

    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  const handleQuestToggle = async () => {
    const currentQuest = questQuery.data;
    if (!currentQuest) {
      return;
    }

    try {
      await updateQuestCompleted({
        questId: currentQuest.id,
        completed: !currentQuest.completed,
      });

      await questQuery.refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubQuest = async (title: string) => {
    const questId = params().questId;
    if (!questId) {
      return;
    }

    try {
      await addQuest({ title, parentId: questId });
      await subQuestsQuery.refetch();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSubQuestDeleted = () => {
    subQuestsQuery.refetch();
  };

  const handleSubQuestToggled = () => {
    subQuestsQuery.refetch();
    questQuery.refetch();
  };

  const subQuestsCount = () => subQuestsQuery.data?.length ?? 0;
  const subQuestsCompletedCount = () => subQuestsQuery.data?.filter((quest) => quest.completed).length ?? 0;
  const completionPercentage = () =>
    subQuestsCompletedCount() === 0
      ? 0
      : Math.floor((subQuestsCompletedCount() / subQuestsCount()) * 100);

  return (
    <BaseLayout class="flex min-h-0 flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
      <div class="flex items-start gap-3">
        <button
          type="button"
          onClick={handleBackClick}
          class="pixel-icon-button h-11 w-11 shrink-0 sm:h-12 sm:w-12"
          aria-label="Go back"
        >
          <ChevronLeft />
        </button>

        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="pixel-scroll overflow-x-auto px-1 py-1">
            <Breadcrumbs crumbs={breadcrumbsQuery.data ?? []} />
          </div>

          <PixelTaskRow
            style={{
              contain: "layout",
              "view-transition-name": `quest-${params().questId}`,
            }}
            class="min-h-[70px]"
            leftClass="w-[68px]"
            rightClass="w-[62px]"
            left={
              <Switch>
                <Match when={subQuestsQuery.data?.length === 0}>
                  <TaskStatusCell
                    completed={questQuery.data?.completed}
                    onToggle={handleQuestToggle}
                    ariaLabel={
                      questQuery.data?.completed ? "Mark task as pending" : "Mark task as completed"
                    }
                  />
                </Match>

                <Match when={subQuestsQuery.data?.length && subQuestsQuery.data.length > 0}>
                  <TaskStatusCell class="pixel-progress-box--centered" progress={completionPercentage()} />
                </Match>
              </Switch>
            }
            right={<DeleteButton onDelete={handleDeleteQuest} />}
          >
            <div class="flex min-w-0 flex-1 items-center px-4 py-2.5">
              <EditableText
                value={questQuery.data?.title ?? ""}
                onSubmit={handleTitleChange}
                focusable={() => true}
                class="pixel-title text-[1rem] sm:text-[1.08rem]"
                inputClass="min-h-[44px]"
              />
            </div>
          </PixelTaskRow>
        </div>
      </div>

      <div class="mt-5 flex min-h-0 flex-1 overflow-hidden">
        <SubQuests
          quests={subQuestsQuery.data ?? []}
          onQuestDeleted={handleSubQuestDeleted}
          onQuestToggled={handleSubQuestToggled}
          onOrderChanged={() => subQuestsQuery.refetch()}
        />
      </div>

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
          add subtask
        </Button>
      </section>

      <AddQuestDialog
        open={isAddDialogOpen()}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddSubQuest}
      />
    </BaseLayout>
  );
}

const Breadcrumbs: Component<{
  crumbs: BreadcrumbQuest[];
}> = (props) => {
  return (
    <div class="pixel-breadcrumbs">
      <Link to="/" search={{ filter: "all" }} class="underline underline-offset-2">
        tasks
      </Link>

      <For each={props.crumbs}>
        {(crumb, index) => {
          const isLast = () => index() === props.crumbs.length - 1;

          return (
            <>
              <span>/</span>

              <Show
                when={!isLast()}
                fallback={
                  <span class="max-w-[220px] truncate text-[var(--ink-color)]" title={crumb.title}>
                    {crumb.title}
                  </span>
                }
              >
                <Link
                  to="/quests/$questId"
                  params={{ questId: crumb.id }}
                  class="max-w-[180px] truncate underline underline-offset-2"
                  title={crumb.title}
                >
                  {crumb.title}
                </Link>
              </Show>
            </>
          );
        }}
      </For>
    </div>
  );
};

const createInsertPointElement = () => {
  const div = document.createElement("div");
  div.classList.add("relative", "h-3", "w-full");

  const line = document.createElement("div");
  line.classList.add("absolute", "left-0", "right-0", "top-1/2", "h-[2px]", "bg-[var(--accent-color)]");

  const label = document.createElement("div");
  label.classList.add(
    "type-pixel",
    "absolute",
    "left-1/2",
    "top-1/2",
    "-translate-x-1/2",
    "-translate-y-1/2",
    "border-2",
    "border-[var(--line-color)]",
    "bg-[var(--panel-color)]",
    "px-2",
    "py-0.5",
    "text-[0.55rem]",
    "text-[var(--ink-color)]",
  );
  label.textContent = "insert";

  div.append(line, label);
  return div;
};

const SubQuests: Component<{
  quests: Quest[];
  onQuestDeleted?: (id: string) => void;
  onQuestToggled?: (id: string) => void;
  onOrderChanged?: () => void;
}> = (props) => {
  let questsContainer!: HTMLDivElement;

  onMount(() => {
    dragAndDrop({
      parent: questsContainer,
      group: "quests",
      state: [
        () => props.quests,
        async (data) => {
          const ids = data.map((quest) => quest.id);
          await updateQuestsOrder({ ids });
          props.onOrderChanged?.();
        },
      ],
      handleNodePointerdown: () => { },
      handlePointercancel: () => { },
      dragHandle: ".drag-handle",
      plugins: [
        animations(),
        insert({
          insertPoint: () => createInsertPointElement(),
        }),
      ],
    });
  });

  return (
    <section
      class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto"
      style={{ "view-transition-name": "sub-quests-container" }}
    >
      <Show when={props.quests.length > 0}>
        <h3 class="pixel-section-title px-1 text-[var(--muted-color)]">subtasks</h3>
        <div ref={questsContainer} class="flex flex-col gap-2 pr-1">
          <For each={props.quests}>
            {(quest) => (
              <QuestCard
                data-label={quest.id}
                quest={quest}
                onDeleted={() => props.onQuestDeleted?.(quest.id)}
                onToggled={() => props.onQuestToggled?.(quest.id)}
              />
            )}
          </For>
        </div>
      </Show>

      <Show when={props.quests.length === 0}>
        <div class="pixel-empty-state w-full">no subtasks yet</div>
      </Show>
    </section>
  );
};
