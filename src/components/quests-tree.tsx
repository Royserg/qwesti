import { useNavigate, useSearch } from "@tanstack/solid-router";
import ChevronDown from "icons/chevron-down";
import ChevronRight from "icons/chevron-right";
import { For, Show, createSignal, type Accessor, type Component } from "solid-js";
import type { Quest } from "~/bindings";
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
    <div class="flex h-full flex-col gap-6 overflow-hidden">
      <Show when={isTodaySelected()}>
        <Filters filter={(props.filter as string) ?? "all"} />
      </Show>

      <div class="scrollbar-hide flex h-full overflow-auto pb-3">
        <Show when={props.quests.length === 0}>
          <h3 class="text-accent mt-10 h-full w-full text-center text-3xl">No tasks</h3>
        </Show>

        <Show when={props.quests.length > 0}>
          <div class="w-full min-w-max pr-2">
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

  const openQuestDetails = async () => {
    await navigate({ to: "/quests/$questId", params: { questId: props.quest.id } });
  };

  return (
    <div class="min-w-max">
      <div
        class="group flex min-w-max items-center rounded-xs py-0.5 pr-2 hover:bg-amber-50"
        style={{ "padding-left": `${props.level * 1.25 + 0.25}rem` }}
      >
        <Show
          when={hasChildren()}
          fallback={<span class="inline-flex size-4 shrink-0 items-center justify-center" />}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              props.onToggle(props.quest.id);
            }}
            class="inline-flex size-4 shrink-0 items-center justify-center rounded-xs text-gray-500 hover:bg-gray-200"
            aria-label={isCollapsed() ? "Expand branch" : "Collapse branch"}
          >
            <Show when={isCollapsed()} fallback={<ChevronDown class="size-3.5" />}>
              <ChevronRight class="size-3.5" />
            </Show>
          </button>
        </Show>

        <button
          type="button"
          onClick={openQuestDetails}
          class="flex min-w-max flex-1 items-center gap-2 rounded-xs py-1 pr-2 text-left"
        >
          <span
            class={cn("inline-flex h-2 w-2 shrink-0 rounded-full", {
              "bg-amber-500": !props.quest.completed,
              "bg-gray-300": props.quest.completed,
            })}
          />

          <span
            class={cn("whitespace-nowrap", {
              "text-gray-400 line-through": props.quest.completed,
              "text-gray-800": !props.quest.completed,
            })}
            title={props.quest.title}
          >
            {props.quest.title}
          </span>
        </button>
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
