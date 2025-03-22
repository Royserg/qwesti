import {
  Component,
  ErrorBoundary,
  For,
  Show
} from "solid-js";
import { Quest } from "~/bindings";
import { QuestsFilterEnumType } from "~/routes";
import { isTodaySelected } from "~/stores/date";
import { Filters } from "./filters";
import { QuestCard } from "./quest-card";


interface Props {
  filter: QuestsFilterEnumType;
  quests: Quest[];
  onQuestDeleted: () => void;
}
export const QuestsList: Component<Props> = (props) => {
  const filteredList = (quests: Quest[]) => {
    if (props.filter === 'pending') {
      return quests.filter((quest) => !quest.completed);
    }
    if (props.filter === 'completed') {
      return quests.filter((quest) => quest.completed);
    }

    return quests;
  };

  return (
    <div class="h-full flex flex-col gap-6 overflow-hidden">
      <Show when={props.quests}>
        {(quests) => {
          return (
            <Show when={quests()?.length > 0 && isTodaySelected()}>
              <Filters filter={(props.filter as string) ?? "all"} />
            </Show>
          )
        }}
      </Show>

      <ul
        class="h-full flex flex-col gap-1 overflow-y-auto pb-3 scrollbar-hide"
      >
        <ErrorBoundary fallback={<div>Error</div>}>
          <Show when={filteredList(props.quests ?? []).length === 0}>
            <h3 class="h-full text-center mt-10 text-3xl text-accent">No quests</h3>
          </Show>

          <For each={filteredList(props.quests ?? [])}>
            {(item) => <QuestCard quest={item} onDeleted={props.onQuestDeleted} />}
          </For>
        </ErrorBoundary>
      </ul>
    </div>
  );
};

