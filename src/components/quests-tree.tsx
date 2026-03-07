import { useNavigate, useSearch } from "@tanstack/solid-router";
import ChevronDown from "icons/chevron-down";
import ChevronRight from "icons/chevron-right";
import { For, Show, createMemo, createSignal, type Accessor, type Component } from "solid-js";
import type { Quest } from "~/bindings";
import { PixelTaskRow } from "~/components/pixel-task-row";
import { TaskStatusCell } from "~/components/task-status-cell";
import { cn } from "~/lib/utils";
import type { QuestsFilterEnumType } from "~/routes";
import { Filters } from "./filters";

interface Props {
  filter: QuestsFilterEnumType;
  quests: Quest[];
}

export const QuestsTree: Component<Props> = (props) => {
  const search = useSearch({ from: "/" });
  const [collapsedIds, setCollapsedIds] = createSignal<Set<string>>(new Set());

  const isTodaySelected = () => !search().date;

  const toggleNode = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
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
            <For each={props.quests}>
              {(quest) => (
                <TreeNode
                  quest={quest}
                  level={0}
                  collapsedIds={collapsedIds}
                  onToggle={toggleNode}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

interface TreeNodeProps {
  quest: Quest;
  level: number;
  collapsedIds: Accessor<Set<string>>;
  onToggle: (id: string) => void;
}

const TreeNode: Component<TreeNodeProps> = (props) => {
  const navigate = useNavigate({ from: "/" });

  const hasChildren = () => (props.quest.children?.length ?? 0) > 0;
  const isCollapsed = () => props.collapsedIds().has(props.quest.id);

  const completionPercentage = createMemo(() => {
    const total = props.quest.children?.length ?? 0;
    const completed = props.quest.children?.filter((child) => child.completed).length ?? 0;
    if (total === 0) {
      return props.quest.completed ? 100 : 0;
    }
    return Math.floor((completed / total) * 100);
  });

  const openQuestDetails = async () => {
    await navigate({ to: "/quests/$questId", params: { questId: props.quest.id } });
  };

  const guideColumns = createMemo(() => Array.from({ length: props.level }, (_, index) => index));

  return (
    <div class="relative min-w-max pb-2">
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
          left={
            <Show
              when={hasChildren()}
              fallback={
                <TaskStatusCell completed={props.quest.completed} />
              }
            >
              <TaskStatusCell progress={completionPercentage()} />
            </Show>
          }
          right={hasChildren() ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                props.onToggle(props.quest.id);
              }}
              class="pixel-status-box"
              aria-label={isCollapsed() ? "Expand branch" : "Collapse branch"}
            >
              <Show when={isCollapsed()} fallback={<ChevronDown class="size-4" />}>
                <ChevronRight class="size-4" />
              </Show>
            </button>
          ) : undefined}
        >
          <button
            type="button"
            onClick={openQuestDetails}
            class="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left"
          >
            <span
              class={cn("pixel-title whitespace-nowrap", {
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
        <For each={props.quest.children ?? []}>
          {(child) => (
            <TreeNode
              quest={child}
              level={props.level + 1}
              collapsedIds={props.collapsedIds}
              onToggle={props.onToggle}
            />
          )}
        </For>
      </Show>
    </div>
  );
};
