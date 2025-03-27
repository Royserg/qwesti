import { useDragAndDrop } from "@formkit/drag-and-drop/solid";
import { useSearch } from "@tanstack/solid-router";
import {
  type Component,
  ErrorBoundary,
  For,
  Show
} from "solid-js";
import type { Quest } from "~/bindings";
import { getTodayDate } from "~/lib/date";
import type { QuestsFilterEnumType } from "~/routes";
import { Filters } from "./filters";
import { QuestCard } from "./quest-card";
import { updateQuestsOrder } from "~/actions/update-quests-order";

interface Props {
  filter: QuestsFilterEnumType;
  quests: Quest[];
  onQuestDeleted: () => void;
}

export const QuestsList: Component<Props> = (props) => {
  const [questsContainer, quests] = useDragAndDrop<HTMLDivElement, Quest>(props.quests, {
    dragHandle: '.drag-handle',
    onDragend: async (data) => {
      const ids = (data.values as Quest[]).map(q => q.id)
      await updateQuestsOrder({ ids })
    },
    // NOTE: without this QuestCard delete button doesnt fire Pointer events
    handleNodePointerdown: (_data) => {
    },
    handleNodePointerup: (_data) => {
    },
    handlePointercancel: (_data) => {
    }
  })

  const search = useSearch({ from: "/" });

  const isTodaySelected = () => {
    return search().date === getTodayDate();
  };

  return (
    <div class="flex h-full flex-col gap-6 overflow-hidden">
      {/* NOTE: Show only for today's date */}
      <Show when={isTodaySelected()}>
        <Filters filter={(props.filter as string) ?? "all"} />
      </Show>

      <ul class="scrollbar-hide flex h-full flex-col gap-1 overflow-y-auto pb-3">
        <ErrorBoundary fallback={<div>Error</div>}>
          <Show when={quests().length === 0}>
            <h3 class="text-accent mt-10 h-full text-center text-3xl">
              No quests
            </h3>
          </Show>

          <div
            ref={questsContainer}
            class="flex flex-col gap-1 self-stretch"
          >
            <For each={quests()}>
              {(q) => {
                return (
                  <QuestCard
                    quest={q}
                    onDeleted={props.onQuestDeleted}
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

