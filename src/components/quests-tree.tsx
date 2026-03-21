import { DragDropProvider, DragOverlay, useDraggable, useDroppable, type DragDropProviderProps } from "@dnd-kit/solid";
import { useNavigate, useSearch } from "@tanstack/solid-router";
import ChevronDown from "icons/chevron-down";
import Minus from "icons/minus";
import { For, Show, createMemo, createSignal, onCleanup, type Component } from "solid-js";
import { deleteQuest, updateQuestCompleted } from "~/actions";
import { DeleteButton } from "~/components/delete-button";
import { PixelTaskRow } from "~/components/pixel-task-row";
import { TaskDragOverlay } from "~/components/task-drag-overlay";
import { TaskStatusCell } from "~/components/task-status-cell";
import {
  DRAG_DROP_OVERLAY_ANIMATION,
  DRAG_CLICK_SUPPRESS_MS,
  ROOT_PARENT_ID,
  TREE_AUTO_EXPAND_DELAY_MS,
  dragSensors,
  isTreeInsertDropData,
  isTreeIntoDropData,
  isTreeItemDragData,
  serializeParentId,
  type TaskDragSnapshot,
  type TreeInsertDropData,
  type TreeIntoDropData,
  type TreeItemDragData,
} from "~/lib/drag-drop";
import { collectDescendantIds, resolveTreeMove, type TreeMoveResolution, type TreeQuest } from "~/lib/quest-tree";
import { cn } from "~/lib/utils";
import type { QuestsFilterEnumType } from "~/routes";
import { Filters } from "./filters";

interface Props {
  filter: QuestsFilterEnumType;
  quests: TreeQuest[];
  collapsedIds: Set<string>;
  hasExpandableTasks: boolean;
  hasExpandedTasks: boolean;
  onToggleAll: () => void;
  onToggleNode: (id: string) => void;
  onPersistMoveQuest: (questId: string, parentId: string | null, index: number) => Promise<void>;
  onQuestDeleted: () => void;
  onQuestToggled: () => void;
}

type ProviderDragStartEvent = Parameters<NonNullable<DragDropProviderProps["onDragStart"]>>[0];
type ProviderDragOverEvent = Parameters<NonNullable<DragDropProviderProps["onDragOver"]>>[0];
type ProviderDragEndEvent = Parameters<NonNullable<DragDropProviderProps["onDragEnd"]>>[0];

type TreeDropIntent =
  | {
    kind: "insert";
    parentId: string | null;
    index: number;
  }
  | {
    kind: "into";
    questId: string;
    parentId: string;
    index: number;
  };

interface TreeListProps {
  quests: TreeQuest[];
  parentId: string | null;
  level: number;
  dropIntent: TreeDropIntent | null;
  collapsedIds: Set<string>;
  temporarilyExpandedIds: Set<string>;
  onToggleNode: (id: string) => void;
  onQuestDeleted: () => void;
  onQuestToggled: () => void;
  isNavigationSuppressed: () => boolean;
}

interface TreeNodeProps extends TreeListProps {
  quest: TreeQuest;
  index: number;
}

const createSnapshot = (quest: TreeQuest, progress?: number): TaskDragSnapshot => ({
  title: quest.title,
  completed: quest.completed,
  progress,
});

const buildDropIntentKey = (intent: TreeDropIntent) =>
  intent.kind === "insert"
    ? `insert|${intent.parentId ?? ROOT_PARENT_ID}|${intent.index}`
    : `into|${intent.questId}|${intent.index}`;

const resolveTargetMove = (
  data: unknown,
): { intent: TreeDropIntent; autoExpandQuestId?: string } | null => {
  if (isTreeInsertDropData(data)) {
    return {
      intent: {
        kind: "insert",
        parentId: data.parentId,
        index: data.index,
      },
    };
  }

  if (isTreeIntoDropData(data)) {
    return {
      intent: {
        kind: "into",
        questId: data.questId,
        parentId: data.questId,
        index: data.childCount,
      },
      autoExpandQuestId: data.hasChildren ? data.questId : undefined,
    };
  }

  return null;
};

const isActiveInsertIntent = (
  dropIntent: TreeDropIntent | null,
  parentId: string | null,
  index: number,
) =>
  dropIntent?.kind === "insert"
  && dropIntent.parentId === parentId
  && dropIntent.index === index;

export const QuestsTree: Component<Props> = (props) => {
  const search = useSearch({ from: "/" });
  const [activeSnapshot, setActiveSnapshot] = createSignal<TaskDragSnapshot | null>(null);
  const [dropIntent, setDropIntent] = createSignal<TreeDropIntent | null>(null);
  const [temporarilyExpandedIds, setTemporarilyExpandedIds] = createSignal<Set<string>>(new Set());
  let hoverExpandTimer: number | undefined;
  let hoverExpandCandidateId: string | null = null;
  let activeIntentKey: string | null = null;
  let pendingMove: TreeMoveResolution | null = null;
  let suppressNavigationUntil = 0;

  const isTodaySelected = () => !search().date;

  const clearHoverExpandTimer = () => {
    if (hoverExpandTimer !== undefined) {
      window.clearTimeout(hoverExpandTimer);
      hoverExpandTimer = undefined;
    }

    hoverExpandCandidateId = null;
  };

  const scheduleExpand = (questId: string | undefined) => {
    if (!questId || !props.collapsedIds.has(questId) || temporarilyExpandedIds().has(questId)) {
      clearHoverExpandTimer();
      return;
    }

    if (hoverExpandCandidateId === questId) {
      return;
    }

    clearHoverExpandTimer();
    hoverExpandCandidateId = questId;
    hoverExpandTimer = window.setTimeout(() => {
      setTemporarilyExpandedIds((prev) => {
        if (prev.has(questId)) {
          return prev;
        }

        const next = new Set(prev);
        next.add(questId);
        return next;
      });

      hoverExpandTimer = undefined;
      hoverExpandCandidateId = null;
    }, TREE_AUTO_EXPAND_DELAY_MS);
  };

  const clearDropPreview = () => {
    setDropIntent(null);
    pendingMove = null;
    activeIntentKey = null;
  };

  const clearDragState = () => {
    clearHoverExpandTimer();
    clearDropPreview();
    setActiveSnapshot(null);
    setTemporarilyExpandedIds(new Set<string>());
    suppressNavigationUntil = performance.now() + DRAG_CLICK_SUPPRESS_MS;
  };

  const handleDragStart = (event: ProviderDragStartEvent) => {
    const sourceData = event.operation.source?.data;
    if (!isTreeItemDragData(sourceData)) {
      return;
    }

    clearHoverExpandTimer();
    clearDropPreview();
    setActiveSnapshot(sourceData.snapshot);
    setTemporarilyExpandedIds(new Set<string>());
  };

  const handleDragOver = (event: ProviderDragOverEvent) => {
    const sourceData = event.operation.source?.data;
    if (!isTreeItemDragData(sourceData)) {
      return;
    }

    const resolvedTarget = resolveTargetMove(event.operation.target?.data);
    if (!resolvedTarget) {
      clearHoverExpandTimer();
      clearDropPreview();
      return;
    }

    scheduleExpand(resolvedTarget.autoExpandQuestId);

    const move = resolveTreeMove(
      props.quests,
      sourceData.questId,
      resolvedTarget.intent.parentId,
      resolvedTarget.intent.index,
    );

    if (!move) {
      clearDropPreview();
      return;
    }

    const nextIntentKey = buildDropIntentKey(resolvedTarget.intent);
    if (nextIntentKey === activeIntentKey) {
      pendingMove = move;
      return;
    }

    pendingMove = move;
    activeIntentKey = nextIntentKey;
    setDropIntent(resolvedTarget.intent);
  };

  const handleDragEnd = async (event: ProviderDragEndEvent) => {
    const sourceData = event.operation.source?.data;
    const move = pendingMove;
    const intent = dropIntent();

    clearHoverExpandTimer();

    if (event.canceled || !isTreeItemDragData(sourceData) || !move || !intent) {
      clearDragState();
      return;
    }

    clearDragState();
    await props.onPersistMoveQuest(sourceData.questId, intent.parentId, intent.index);
  };

  onCleanup(() => {
    clearHoverExpandTimer();
  });

  return (
    <DragDropProvider
      sensors={dragSensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
    >
      <div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Show when={isTodaySelected()}>
          <div class="flex w-full justify-end items-end gap-2">
            <button
              type="button"
              class="pixel-icon-button size-7 shrink-0"
              classList={{
                "pointer-events-none opacity-50": !props.hasExpandableTasks,
              }}
              title={props.hasExpandedTasks ? "Collapse all tasks" : "Expand all tasks"}
              aria-label={props.hasExpandedTasks ? "Collapse all tasks" : "Expand all tasks"}
              disabled={!props.hasExpandableTasks}
              onClick={props.onToggleAll}
            >
              <Show when={props.hasExpandedTasks} fallback={<ChevronDown class="size-[18px]" />}>
                <Minus class="size-[18px]" />
              </Show>
            </button>
            <Filters filter={(props.filter as string) ?? "all"} />
          </div>
        </Show>

        <div class="pixel-scroll flex min-h-0 flex-1 overflow-auto pb-4">
          <Show when={props.quests.length === 0}>
            <div class="pixel-empty-state w-full">no tasks</div>
          </Show>

        <Show when={props.quests.length > 0}>
            <div class="w-full min-w-0 pr-1">
              <TreeList
                quests={props.quests}
                parentId={null}
                level={0}
                dropIntent={dropIntent()}
                collapsedIds={props.collapsedIds}
                temporarilyExpandedIds={temporarilyExpandedIds()}
                onToggleNode={props.onToggleNode}
                onQuestDeleted={props.onQuestDeleted}
                onQuestToggled={props.onQuestToggled}
                isNavigationSuppressed={() => performance.now() < suppressNavigationUntil}
              />
            </div>
          </Show>
        </div>
      </div>

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

const TreeList: Component<TreeListProps> = (props) => {
  return (
    <div
      class={cn("pixel-tree-list", {
        "pixel-tree-list--root": props.parentId === null,
        "pixel-tree-list--empty": props.quests.length === 0,
      })}
    >
      <TreeInsertSlot
        level={props.level}
        parentId={props.parentId}
        index={0}
        active={isActiveInsertIntent(props.dropIntent, props.parentId, 0)}
      />

      <For each={props.quests}>
        {(quest, index) => (
          <>
            <TreeNode
              quest={quest}
              index={index()}
              quests={props.quests}
              parentId={props.parentId}
              level={props.level}
              dropIntent={props.dropIntent}
              collapsedIds={props.collapsedIds}
              temporarilyExpandedIds={props.temporarilyExpandedIds}
              onToggleNode={props.onToggleNode}
              onQuestDeleted={props.onQuestDeleted}
              onQuestToggled={props.onQuestToggled}
              isNavigationSuppressed={props.isNavigationSuppressed}
            />

            <TreeInsertSlot
              level={props.level}
              parentId={props.parentId}
              index={index() + 1}
              active={isActiveInsertIntent(props.dropIntent, props.parentId, index() + 1)}
            />
          </>
        )}
      </For>
    </div>
  );
};

const TreeNode: Component<TreeNodeProps> = (props) => {
  const navigate = useNavigate({ from: "/" });
  const hasChildren = () => props.quest.children.length > 0;
  const isCollapsed = () =>
    hasChildren()
    && props.collapsedIds.has(props.quest.id)
    && !props.temporarilyExpandedIds.has(props.quest.id);
  const isDropIntoActive = () =>
    props.dropIntent?.kind === "into" && props.dropIntent.questId === props.quest.id;

  const completionPercentage = createMemo(() => {
    const total = props.quest.children.length;
    const completed = props.quest.children.filter((child) => child.completed).length;

    if (total === 0) {
      return props.quest.completed ? 100 : 0;
    }

    return Math.floor((completed / total) * 100);
  });

  const guideColumns = createMemo(() => Array.from({ length: props.level }, (_, index) => index));
  const draggable = useDraggable<TreeItemDragData>({
    id: `tree-row:${props.quest.id}`,
    data: {
      kind: "tree-item",
      questId: props.quest.id,
      parentId: props.parentId,
      index: props.index,
      childCount: props.quest.children.length,
      hasChildren: hasChildren(),
      descendantIds: collectDescendantIds(props.quest),
      snapshot: createSnapshot(props.quest, hasChildren() ? completionPercentage() : undefined),
    },
  });
  const intoDroppable = useDroppable<TreeIntoDropData>({
    id: `tree-into:${props.quest.id}`,
    data: {
      kind: "tree-into",
      questId: props.quest.id,
      childCount: props.quest.children.length,
      hasChildren: hasChildren(),
    },
  });

  const setRowRef = (element: Element | undefined) => {
    draggable.ref(element);
  };

  const setRowBodyRef = (element: Element | undefined) => {
    draggable.handleRef(element);
    intoDroppable.ref(element);
  };

  const handleQuestToggle = async () => {
    if (hasChildren()) {
      return;
    }

    try {
      await updateQuestCompleted({
        questId: props.quest.id,
        completed: !props.quest.completed,
      });

      props.onQuestToggled();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async () => {
    await deleteQuest({ questId: props.quest.id });
    props.onQuestDeleted();
  };

  const handleOpenQuestDetails = async () => {
    if (props.isNavigationSuppressed()) {
      return;
    }

    await navigate({ to: "/quests/$questId", params: { questId: props.quest.id } });
  };

  return (
    <div class="relative min-w-0 pb-[1px]">
      <div class="pointer-events-none absolute bottom-0 left-0 top-0" style={{ width: `${props.level * 20}px` }}>
        <For each={guideColumns()}>
          {(guideIndex) => (
            <span
              class="absolute bottom-0 top-0 w-[2px] bg-[rgba(29,26,21,0.10)]"
              style={{ left: `${guideIndex * 20 + 8}px` }}
            />
          )}
        </For>

        <Show when={props.level > 0}>
          <span
            class="absolute h-[2px] bg-[rgba(29,26,21,0.25)]"
            style={{
              left: `${props.level * 20 - 12}px`,
              top: "30px",
              width: "16px",
            }}
          />
        </Show>
      </div>

      <div style={{ "padding-left": `${props.level * 1.25}rem` }}>
        <PixelTaskRow
          ref={setRowRef}
          style={{ "view-transition-name": `quest-${props.quest.id}` }}
          class={cn({
            "pixel-task-row--drag-source": draggable.isDragging(),
          })}
          left={
            <Show
              when={hasChildren()}
              fallback={
                <TaskStatusCell
                  completed={props.quest.completed}
                  onToggle={handleQuestToggle}
                  ariaLabel={props.quest.completed ? "Mark task as pending" : "Mark task as completed"}
                />
              }
            >
              <TaskStatusCell
                progress={completionPercentage()}
                onToggle={() => props.onToggleNode(props.quest.id)}
                ariaLabel={isCollapsed() ? "Expand subtasks" : "Collapse subtasks"}
              />
            </Show>
          }
          right={<DeleteButton onDelete={handleDeleteQuest} />}
        >
          <button
            ref={setRowBodyRef}
            type="button"
            onClick={() => {
              void handleOpenQuestDetails();
            }}
            class={cn("pixel-tree-row-button", {
              "pixel-tree-row-button--drop-into": isDropIntoActive(),
            })}
          >
            <span
              class={cn("pixel-title block w-full truncate", {
                "pixel-title--done": props.quest.completed,
              })}
              title={props.quest.title}
            >
              {props.quest.title}
            </span>
          </button>
        </PixelTaskRow>
      </div>

      <TreeChildLane level={props.level + 1} active={isDropIntoActive()} />

      <Show when={hasChildren() && !isCollapsed()}>
        <TreeList
          quests={props.quest.children}
          parentId={props.quest.id}
          level={props.level + 1}
          dropIntent={props.dropIntent}
          collapsedIds={props.collapsedIds}
          temporarilyExpandedIds={props.temporarilyExpandedIds}
          onToggleNode={props.onToggleNode}
          onQuestDeleted={props.onQuestDeleted}
          onQuestToggled={props.onQuestToggled}
          isNavigationSuppressed={props.isNavigationSuppressed}
        />
      </Show>
    </div>
  );
};

const TreeInsertSlot: Component<{
  level: number;
  parentId: string | null;
  index: number;
  active: boolean;
}> = (props) => {
  const droppable = useDroppable<TreeInsertDropData>({
    id: `tree-insert:${serializeParentId(props.parentId)}:${props.index}`,
    data: {
      kind: "tree-insert",
      parentId: props.parentId,
      index: props.index,
    },
  });

  return (
    <div style={{ "padding-left": `${props.level * 1.25}rem` }}>
      <div
        ref={droppable.ref}
        class={cn("pixel-drop-slot pixel-drop-slot--tree", {
          "pixel-drop-slot--active": props.active,
        })}
      />
    </div>
  );
};

const TreeChildLane: Component<{
  level: number;
  active: boolean;
}> = (props) => {
  return (
    <div style={{ "padding-left": `${props.level * 1.25}rem` }}>
      <div
        class={cn("pixel-tree-child-lane", {
          "pixel-tree-child-lane--active": props.active,
        })}
      />
    </div>
  );
};
