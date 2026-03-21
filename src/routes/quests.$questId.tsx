import { DragDropProvider, DragOverlay, useDraggable, useDroppable, type DragDropProviderProps } from "@dnd-kit/solid";
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
import { Component, For, Match, Show, Switch, createSignal } from "solid-js";
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
import { QuestDescriptionCard } from "~/components/quest-description-card";
import { PixelTaskRow } from "~/components/pixel-task-row";
import { QuestCard } from "~/components/quest-card";
import { TaskDragOverlay } from "~/components/task-drag-overlay";
import { TaskStatusCell } from "~/components/task-status-cell";
import { Button } from "~/components/ui/button";
import {
  DRAG_DROP_OVERLAY_ANIMATION,
  DRAG_CLICK_SUPPRESS_MS,
  dragSensors,
  isFlatInsertDropData,
  isFlatItemDragData,
  moveItemToIndex,
  type FlatInsertDropData,
  type FlatItemDragData,
} from "~/lib/drag-drop";
import { BaseLayout } from "~/layouts/base";
import { queryClient } from "./__root";

type BreadcrumbQuest = {
  id: string;
  title: string;
};

type ProviderDragStartEvent = Parameters<NonNullable<DragDropProviderProps["onDragStart"]>>[0];
type ProviderDragOverEvent = Parameters<NonNullable<DragDropProviderProps["onDragOver"]>>[0];
type ProviderDragEndEvent = Parameters<NonNullable<DragDropProviderProps["onDragEnd"]>>[0];

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

  const handleAddSubQuest = async (data: { title: string; description?: string; descriptionDraftId?: string }) => {
    const questId = params().questId;
    if (!questId) {
      return;
    }

    try {
      await addQuest({
        title: data.title,
        parentId: questId,
        description: data.description,
        descriptionDraftId: data.descriptionDraftId,
      });
      await subQuestsQuery.refetch();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSubQuestDeleted = () => {
    subQuestsQuery.refetch();
  };

  const handleSubQuestToggled = async () => {
    await Promise.all([subQuestsQuery.refetch(), questQuery.refetch()]);
  };

  const subQuestsCount = () => subQuestsQuery.data?.length ?? 0;
  const subQuestsCompletedCount = () => subQuestsQuery.data?.filter((quest) => quest.completed).length ?? 0;
  const completionPercentage = () =>
    subQuestsCompletedCount() === 0
      ? 0
      : Math.floor((subQuestsCompletedCount() / subQuestsCount()) * 100);

  return (
    <BaseLayout class="relative flex min-h-0 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
      <div class="flex items-start gap-3">
        <button
          type="button"
          onClick={handleBackClick}
          class="pixel-icon-button h-11 w-11 shrink-0 sm:h-12 sm:w-12"
          aria-label="Go back"
        >
          <ChevronLeft />
        </button>

        <div class="flex min-w-0 flex-1 flex-col gap-2 pt-1">
          <div class="pixel-scroll overflow-x-auto px-1 py-1">
            <Breadcrumbs crumbs={breadcrumbsQuery.data ?? []} />
          </div>
        </div>
      </div>

      <section class="mt-4 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-2">
        <section class="flex w-full flex-col gap-3">
          <PixelTaskRow
            style={{
              contain: "layout",
              "view-transition-name": `quest-${params().questId}`,
            }}
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
                  <TaskStatusCell progress={completionPercentage()} />
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
                class="pixel-title truncate text-[1rem] sm:text-[1.08rem]"
                inputClass="min-h-[44px]"
              />
            </div>
          </PixelTaskRow>

          <Show when={questQuery.data}>
            {(quest) => (
              <QuestDescriptionCard
                questId={quest().id}
                description={quest().description ?? null}
                assets={quest().descriptionAssets ?? []}
                onSaved={async () => {
                  await questQuery.refetch();
                }}
              />
            )}
          </Show>
        </section>

        <section class="mt-5 w-full pl-5 sm:pl-9">
          <div class="flex w-full max-w-[860px] flex-col gap-4">
            <SubQuests
              groupId={params().questId}
              quests={subQuestsQuery.data ?? []}
              onQuestDeleted={handleSubQuestDeleted}
              onQuestToggled={handleSubQuestToggled}
              onOrderChanged={() => subQuestsQuery.refetch()}
            />
          </div>
        </section>
      </section>

      <section
        style={{
          "view-transition-name": "bottom-bar",
        }}
        class="mt-4 shrink-0"
      >
        <Button
          class="pixel-button--action h-[60px] w-full"
          onClick={() => {
            setIsAddDialogOpen(true);
          }}
        >
          Add subtask
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

const SubQuests: Component<{
  groupId: string;
  quests: Quest[];
  onQuestDeleted?: (id: string) => void;
  onQuestToggled?: (id: string) => void;
  onOrderChanged?: () => void;
}> = (props) => {
  const [draggedQuestId, setDraggedQuestId] = createSignal<string | null>(null);
  const [activeSnapshot, setActiveSnapshot] = createSignal<FlatItemDragData["snapshot"] | null>(null);
  const [dropIndex, setDropIndex] = createSignal<number | null>(null);
  let suppressNavigationUntil = 0;

  const clearDragState = () => {
    setDraggedQuestId(null);
    setActiveSnapshot(null);
    setDropIndex(null);
    suppressNavigationUntil = performance.now() + DRAG_CLICK_SUPPRESS_MS;
  };

  const handleDragStart = (event: ProviderDragStartEvent) => {
    const sourceData = event.operation.source?.data;
    if (!isFlatItemDragData(sourceData)) {
      return;
    }

    setDropIndex(null);
    setDraggedQuestId(sourceData.questId);
    setActiveSnapshot(sourceData.snapshot);
  };

  const handleDragOver = (event: ProviderDragOverEvent) => {
    const sourceData = event.operation.source?.data;
    if (!isFlatItemDragData(sourceData)) {
      return;
    }

    const targetData = event.operation.target?.data;
    const targetIndex = isFlatInsertDropData(targetData) ? targetData.index : null;

    if (targetIndex === null) {
      setDropIndex(null);
      return;
    }

    const nextQuests = moveItemToIndex(props.quests, sourceData.questId, targetIndex);
    if (!nextQuests) {
      setDropIndex(null);
      return;
    }

    setDropIndex(targetIndex);
  };

  const handleDragEnd = async (event: ProviderDragEndEvent) => {
    const sourceData = event.operation.source?.data;
    const targetIndex = dropIndex();

    const shouldPersist = !event.canceled
      && isFlatItemDragData(sourceData)
      && targetIndex !== null;

    const ids = shouldPersist
      ? moveItemToIndex(props.quests, sourceData.questId, targetIndex)?.map((quest) => quest.id) ?? null
      : null;

    clearDragState();

    if (!shouldPersist || !ids) {
      return;
    }

    try {
      await updateQuestsOrder({ ids });
      props.onOrderChanged?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DragDropProvider
      sensors={dragSensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
    >
      <section
        class="flex flex-col gap-2"
        style={{ "view-transition-name": "sub-quests-container" }}
      >
        <Show when={props.quests.length > 0}>
          <h3 class="pixel-section-title px-1 text-[var(--muted-color)]">subtasks</h3>
          <div class="flex flex-col gap-1 pr-1">
            <FlatInsertSlot index={0} active={dropIndex() === 0} />

            <For each={props.quests}>
              {(quest, index) => (
                <>
                  <DraggableSubQuestCard
                    quest={quest}
                    index={index()}
                    groupId={props.groupId}
                    draggedQuestId={draggedQuestId()}
                    canOpen={() => performance.now() >= suppressNavigationUntil}
                    onDeleted={() => props.onQuestDeleted?.(quest.id)}
                    onToggled={() => props.onQuestToggled?.(quest.id)}
                  />

                  <FlatInsertSlot index={index() + 1} active={dropIndex() === index() + 1} />
                </>
              )}
            </For>
          </div>
        </Show>

        <Show when={props.quests.length === 0}>
          <div class="pixel-empty-state w-full">no subtasks yet</div>
        </Show>
      </section>

      <DragOverlay
        class="pixel-drag-overlay-shell"
        dropAnimation={DRAG_DROP_OVERLAY_ANIMATION}
      >
        <Show when={activeSnapshot()}>
          {(snapshot) => (
            <TaskDragOverlay
              title={snapshot().title}
              completed={snapshot().completed}
              progress={snapshot().progress}
            />
          )}
        </Show>
      </DragOverlay>
    </DragDropProvider>
  );
};

const FlatInsertSlot: Component<{ index: number; active: boolean }> = (props) => {
  const droppable = useDroppable<FlatInsertDropData>({
    id: `flat-insert:${props.index}`,
    data: {
      kind: "flat-insert",
      index: props.index,
    },
  });

  return (
    <div
      ref={droppable.ref}
      classList={{
        "pixel-drop-slot": true,
        "pixel-drop-slot--active": props.active,
      }}
    />
  );
};

const DraggableSubQuestCard: Component<{
  quest: Quest;
  index: number;
  groupId: string;
  draggedQuestId: string | null;
  canOpen: () => boolean;
  onDeleted?: () => void;
  onToggled?: () => void;
}> = (props) => {
  const subQuestsCount = () => props.quest.children?.length ?? 0;
  const subQuestsCompletedCount = () => props.quest.children?.filter((q) => q.completed).length ?? 0;
  const progress = () =>
    subQuestsCompletedCount() === 0
      ? 0
      : Math.floor((subQuestsCompletedCount() / subQuestsCount()) * 100);

  const draggable = useDraggable<FlatItemDragData>({
    id: `flat-row:${props.quest.id}`,
    data: {
      kind: "flat-item",
      questId: props.quest.id,
      index: props.index,
      snapshot: {
        title: props.quest.title,
        completed: props.quest.completed,
        progress: props.quest.hasChildren ? progress() : undefined,
      },
    },
  });

  const setDraggableRowRef = (element: Element | undefined) => {
    draggable.ref(element);
  };

  return (
    <QuestCard
      quest={props.quest}
      rowRef={setDraggableRowRef}
      class={draggable.isDragging() ? "pixel-task-row--drag-source" : undefined}
      titleButtonRef={draggable.handleRef}
      canOpen={props.canOpen}
      onDeleted={props.onDeleted}
      onToggled={props.onToggled}
    />
  );
};
