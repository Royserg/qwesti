import { DragDropProvider, DragOverlay, useDroppable, type DragDropProviderProps } from "@dnd-kit/solid";
import { useSortable } from "@dnd-kit/solid/sortable";
import { useNavigate, useSearch } from "@tanstack/solid-router";
import { For, Show, createMemo, createSignal, onCleanup, type Component } from "solid-js";
import { deleteQuest, updateQuestCompleted } from "~/actions";
import { DeleteButton } from "~/components/delete-button";
import { PixelTaskRow } from "~/components/pixel-task-row";
import { TaskDragOverlay } from "~/components/task-drag-overlay";
import { TaskStatusCell } from "~/components/task-status-cell";
import {
  DRAG_CLICK_SUPPRESS_MS,
  ROOT_PARENT_ID,
  TREE_AUTO_EXPAND_DELAY_MS,
  dragSensors,
  isTreeInsertDropData,
  isTreeItemDragData,
  logDragDebug,
  logDragOperation,
  serializeParentId,
  type TaskDragSnapshot,
  type TreeInsertDropData,
  type TreeItemDragData,
} from "~/lib/drag-drop";
import { collectDescendantIds, type TreeMoveResult, type TreeQuest } from "~/lib/quest-tree";
import { cn } from "~/lib/utils";
import type { QuestsFilterEnumType } from "~/routes";
import { Filters } from "./filters";

interface Props {
  filter: QuestsFilterEnumType;
  quests: TreeQuest[];
  collapsedIds: Set<string>;
  onToggleNode: (id: string) => void;
  onPreviewMoveQuest: (questId: string, parentId: string | null, index: number) => TreeMoveResult | null;
  onResetPreview: () => void;
  onPersistMoveQuest: (questId: string, parentId: string | null, index: number) => Promise<void>;
  onQuestDeleted: () => void;
  onQuestToggled: () => void;
}

type ProviderDragStartEvent = Parameters<NonNullable<DragDropProviderProps["onDragStart"]>>[0];
type ProviderDragOverEvent = Parameters<NonNullable<DragDropProviderProps["onDragOver"]>>[0];
type ProviderDragEndEvent = Parameters<NonNullable<DragDropProviderProps["onDragEnd"]>>[0];

interface TreeListProps {
  quests: TreeQuest[];
  parentId: string | null;
  level: number;
  draggedQuestId: string | null;
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

const buildTreePreviewKey = (questId: string, parentId: string | null, index: number) =>
  `${questId}|${parentId ?? ROOT_PARENT_ID}|${index}`;

const createSnapshot = (quest: TreeQuest, progress?: number): TaskDragSnapshot => ({
  title: quest.title,
  completed: quest.completed,
  progress,
});

const resolveTargetMove = (data: unknown): { parentId: string | null; index: number; autoExpandQuestId?: string } | null => {
  if (isTreeInsertDropData(data)) {
    return {
      parentId: data.parentId,
      index: data.index,
    };
  }

  if (isTreeItemDragData(data)) {
    return {
      parentId: data.questId,
      index: data.childCount,
      autoExpandQuestId: data.hasChildren ? data.questId : undefined,
    };
  }

  return null;
};

export const QuestsTree: Component<Props> = (props) => {
  const search = useSearch({ from: "/" });
  const [draggedQuestId, setDraggedQuestId] = createSignal<string | null>(null);
  const [activeSnapshot, setActiveSnapshot] = createSignal<TaskDragSnapshot | null>(null);
  const [temporarilyExpandedIds, setTemporarilyExpandedIds] = createSignal<Set<string>>(new Set());
  let hoverExpandTimer: number | undefined;
  let hoverExpandCandidateId: string | null = null;
  let lastPreviewKey: string | null = null;
  let pendingMove: TreeMoveResult | null = null;
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

  const resetPreview = () => {
    if (lastPreviewKey !== null) {
      props.onResetPreview();
      lastPreviewKey = null;
    }

    pendingMove = null;
  };

  const clearDragState = () => {
    clearHoverExpandTimer();
    setDraggedQuestId(null);
    setActiveSnapshot(null);
    setTemporarilyExpandedIds(new Set<string>());
    suppressNavigationUntil = performance.now() + DRAG_CLICK_SUPPRESS_MS;
  };

  const handleDragStart = (event: ProviderDragStartEvent) => {
    logDragOperation("tree", "dragstart", event);
    const sourceData = event.operation.source?.data;
    if (!isTreeItemDragData(sourceData)) {
      logDragDebug("tree", "dragstart ignored: source data did not match tree-item", sourceData);
      return;
    }

    clearHoverExpandTimer();
    lastPreviewKey = null;
    pendingMove = null;
    setDraggedQuestId(sourceData.questId);
    setActiveSnapshot(sourceData.snapshot);
    setTemporarilyExpandedIds(new Set<string>());
  };

  const handleDragOver = (event: ProviderDragOverEvent) => {
    logDragOperation("tree", "dragover", event);
    const sourceData = event.operation.source?.data;
    if (!isTreeItemDragData(sourceData)) {
      logDragDebug("tree", "dragover ignored: source data did not match tree-item", sourceData);
      return;
    }

    const resolvedTarget = resolveTargetMove(event.operation.target?.data);
    if (!resolvedTarget) {
      logDragDebug("tree", "dragover ignored: target could not be resolved", event.operation.target?.data);
      clearHoverExpandTimer();
      resetPreview();
      return;
    }

    scheduleExpand(resolvedTarget.autoExpandQuestId);
    const previewKey = buildTreePreviewKey(sourceData.questId, resolvedTarget.parentId, resolvedTarget.index);
    if (previewKey === lastPreviewKey) {
      return;
    }

    const previewResult = props.onPreviewMoveQuest(
      sourceData.questId,
      resolvedTarget.parentId,
      resolvedTarget.index,
    );

    if (!previewResult) {
      logDragDebug("tree", "dragover preview rejected", {
        questId: sourceData.questId,
        requestedParentId: resolvedTarget.parentId,
        requestedIndex: resolvedTarget.index,
      });
      resetPreview();
      return;
    }

    pendingMove = previewResult;
    lastPreviewKey = buildTreePreviewKey(
      sourceData.questId,
      previewResult.targetParentId,
      previewResult.targetIndex,
    );
  };

  const handleDragEnd = async (event: ProviderDragEndEvent) => {
    logDragOperation("tree", "dragend", event);
    const sourceData = event.operation.source?.data;
    const moveResult = pendingMove;

    clearHoverExpandTimer();

    if (event.canceled || !isTreeItemDragData(sourceData) || !moveResult) {
      logDragDebug("tree", "dragend skipped persistence", {
        canceled: event.canceled,
        sourceData,
        moveResult,
      });
      resetPreview();
      clearDragState();
      return;
    }

    pendingMove = null;
    lastPreviewKey = null;
    clearDragState();

    await props.onPersistMoveQuest(
      sourceData.questId,
      moveResult.targetParentId,
      moveResult.targetIndex,
    );
  };

  onCleanup(() => {
    clearHoverExpandTimer();
  });

  return (
    <DragDropProvider
      sensors={dragSensors}
      onBeforeDragStart={(event) => {
        logDragOperation("tree", "beforedragstart", event);
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
    >
      <div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Show when={isTodaySelected()}>
          <Filters filter={(props.filter as string) ?? "all"} />
        </Show>

        <div class="pixel-scroll flex min-h-0 flex-1 overflow-auto pb-4">
          <Show when={props.quests.length === 0}>
            <div class="pixel-empty-state w-full">no tasks</div>
          </Show>

          <Show when={props.quests.length > 0}>
            <div class="w-full min-w-max pr-1">
              <TreeList
                quests={props.quests}
                parentId={null}
                level={0}
                draggedQuestId={draggedQuestId()}
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

      <DragOverlay class="pixel-drag-overlay-shell" dropAnimation={null}>
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
      <TreeInsertSlot level={props.level} parentId={props.parentId} index={0} />

      <For each={props.quests}>
        {(quest, index) => (
          <>
            <TreeNode
              quest={quest}
              index={index()}
              quests={props.quests}
              parentId={props.parentId}
              level={props.level}
              draggedQuestId={props.draggedQuestId}
              collapsedIds={props.collapsedIds}
              temporarilyExpandedIds={props.temporarilyExpandedIds}
              onToggleNode={props.onToggleNode}
              onQuestDeleted={props.onQuestDeleted}
              onQuestToggled={props.onQuestToggled}
              isNavigationSuppressed={props.isNavigationSuppressed}
            />

            <TreeInsertSlot level={props.level} parentId={props.parentId} index={index() + 1} />
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

  const completionPercentage = createMemo(() => {
    const total = props.quest.children.length;
    const completed = props.quest.children.filter((child) => child.completed).length;

    if (total === 0) {
      return props.quest.completed ? 100 : 0;
    }

    return Math.floor((completed / total) * 100);
  });

  const guideColumns = createMemo(() => Array.from({ length: props.level }, (_, index) => index));
  const sortable = useSortable<TreeItemDragData>({
    id: `tree-row:${props.quest.id}`,
    group: `tree-parent:${serializeParentId(props.parentId)}`,
    index: props.index,
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

  const setSortableRowRef = (element: Element | undefined) => {
    sortable.ref(element);
    sortable.sourceRef(element);
    sortable.targetRef(element);
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
    <div class="relative min-w-max pb-[1px]">
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
          ref={setSortableRowRef}
          style={{ "view-transition-name": `quest-${props.quest.id}` }}
          class={cn({
            "pixel-task-row--drag-source": sortable.isDragging(),
            "pixel-task-row--drop-target": sortable.isDropTarget() && props.draggedQuestId !== props.quest.id,
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
            ref={sortable.handleRef}
            type="button"
            onPointerDown={(event) => {
              logDragDebug("tree", "handle pointerdown", {
                questId: props.quest.id,
                pointerType: event.pointerType,
                targetTag: event.currentTarget.tagName,
              });
            }}
            onClick={() => {
              void handleOpenQuestDetails();
            }}
            class="pixel-tree-row-button"
          >
            <span
              class={cn("pixel-title", {
                "pixel-title--done": props.quest.completed,
              })}
              title={props.quest.title}
            >
              {props.quest.title}
            </span>
          </button>
        </PixelTaskRow>
      </div>

      <Show when={hasChildren() && !isCollapsed()}>
        <TreeList
          quests={props.quest.children}
          parentId={props.quest.id}
          level={props.level + 1}
          draggedQuestId={props.draggedQuestId}
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
        class={cn("pixel-drop-slot", {
          "pixel-drop-slot--active": droppable.isDropTarget(),
        })}
      />
    </div>
  );
};
