import { animations, insert } from "@formkit/drag-and-drop";
import { dragAndDrop } from "@formkit/drag-and-drop/solid";
import { useSearch } from "@tanstack/solid-router";
import {
  type Component,
  ErrorBoundary,
  For,
  onMount,
  Show,
} from "solid-js";
import { updateQuestsOrder } from "~/actions/update-quests-order";
import type { Quest } from "~/bindings";
import type { QuestsFilterEnumType } from "~/routes";
import { Filters } from "./filters";
import { QuestCard } from "./quest-card";

interface Props {
  filter: QuestsFilterEnumType;
  quests: Quest[];
  onQuestDeleted: () => void;
  onQuestToggled?: (id: string) => void;
  onOrderChanged?: () => void;
}

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

export const QuestsList: Component<Props> = (props) => {
  let questsContainer!: HTMLDivElement;
  const search = useSearch({ from: "/" });

  const isTodaySelected = () => !search().date;

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
      dragHandle: ".drag-handle",
      handleNodePointerdown: () => { },
      handlePointercancel: () => { },
      plugins: [
        animations(),
        insert({
          insertPoint: () => createInsertPointElement(),
        }),
      ],
    });
  });

  return (
    <div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Show when={isTodaySelected()}>
        <Filters filter={(props.filter as string) ?? "all"} />
      </Show>

      <div class="pixel-scroll flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
        <ErrorBoundary fallback={<div class="pixel-empty-state">error loading tasks</div>}>
          <Show when={props.quests.length === 0}>
            <div class="pixel-empty-state">no tasks</div>
          </Show>

          <div ref={questsContainer} class="relative flex flex-col gap-2 self-stretch pr-1">
            <For each={props.quests}>
              {(quest) => (
                <QuestCard
                  quest={quest}
                  onDeleted={props.onQuestDeleted}
                  onToggled={() => props.onQuestToggled?.(quest.id)}
                  data-label={quest.id}
                />
              )}
            </For>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};
