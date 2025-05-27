import { animations, insert } from "@formkit/drag-and-drop";
import { dragAndDrop } from "@formkit/drag-and-drop/solid";
import { useSearch } from "@tanstack/solid-router";
import {
    type Component,
    ErrorBoundary,
    For,
    onMount,
    Show
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
  div.classList.add("absolute",
    "bg-amber-500",
    "z-200",
    "rounded-full",
    "duration-[5ms]",
    "before:block",
    'before:content-["Insert"]',
    "before:whitespace-nowrap",
    "before:block",
    "before:bg-amber-500",
    "before:py-1",
    "before:px-2",
    "before:rounded-full",
    "before:text-xs",
    "before:absolute",
    "before:top-1/2",
    "before:left-1/2",
    "before:-translate-y-1/2",
    "before:-translate-x-1/2",
    "before:text-white",
    "before:text-xs",);
  return div;
}

export const QuestsList: Component<Props> = (props) => {
  let questsContainer!: HTMLDivElement;

  const search = useSearch({ from: "/" });

  /**
   * today's date doesn't set the search param
   */
  const isTodaySelected = () => {
    return !search().date;
  };

  // NOTE: check how to handle this or change the dnd solution
  onMount(() => {
    dragAndDrop({
      parent: questsContainer,
      group: 'quests',
      state: [
        () => props.quests,
        async (data) => {
          const newOrderedQuests = data;
          const ids = newOrderedQuests.map(q => q.id);
          await updateQuestsOrder({ ids });
          props.onOrderChanged?.()
        }
      ],
      dragHandle: '.drag-handle',
      handleNodePointerdown: () => { },
      handlePointercancel: () => { },
      plugins: [
        animations(),
        insert({
          insertPoint: (_parent) => {
            return createInsertPointElement();
          }
        })
      ]
    });
  })

  return (
    <div class="flex h-full flex-col gap-6 overflow-hidden">
      {/* NOTE: Show only for today's date */}
      <Show when={isTodaySelected()}>
        <Filters filter={(props.filter as string) ?? "all"} />
      </Show>

      <ul class="scrollbar-hide flex h-full flex-col gap-1 overflow-y-auto pb-3">
        <ErrorBoundary fallback={<div>Error</div>}>
          <Show when={props.quests.length === 0}>
            <h3 class="text-accent mt-10 h-full text-center text-3xl">
              No tasks
            </h3>
          </Show>

          <div
            ref={questsContainer}
            class="relative flex flex-col gap-1 self-stretch"
          >
            <For each={props.quests}>
              {(q) => {
                return (
                  <QuestCard
                    quest={q}
                    onDeleted={props.onQuestDeleted}
                    onToggled={() => props.onQuestToggled?.(q.id)}
                    data-label={q.id}
                  />
                );
              }}
            </For>
          </div>
        </ErrorBoundary>
      </ul>
    </div>
  );
};
