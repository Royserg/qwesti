import {
  Component,
  ErrorBoundary,
  For,
  ParentComponent,
  Show
} from "solid-js";
import { Quest } from "~/bindings";
import { cn } from "~/lib/utils";
import { isTodaySelected } from "~/stores/date";
import { QuestCard } from "./quest-card";
import { useNavigate } from "@tanstack/solid-router";

export enum Filter {
  All = "all",
  Pending = "pending",
  Completed = "completed",
}

interface Props {
  filter: Filter;
  quests: Quest[];
}
export const QuestsList: Component<Props> = (props) => {
  const filteredList = (quests: Quest[]) => {
    if (props.filter === Filter.Pending) {
      return quests.filter((quest) => !quest.completed);
    }
    if (props.filter === Filter.Completed) {
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
        class="h-full flex flex-col gap-1 overflow-y-auto pb-2 scrollbar-hide"
      >
        <ErrorBoundary fallback={<div>Error</div>}>
          <Show when={filteredList(props.quests ?? []).length === 0}>
            <h3 class="h-full text-center mt-10 text-3xl text-accent">No quests</h3>
          </Show>

          <For each={filteredList(props.quests ?? [])}>
            {(item) => <QuestCard quest={item} />}
          </For>
        </ErrorBoundary>
      </ul>
    </div>
  );
};

// -- Filter Button --
interface FiltersProps {
  filter: string;
}
const Filters: Component<FiltersProps> = (props) => {
  const filters = [
    {
      value: "all",
      label: "all",
    },
    {
      value: "pending",
      label: "pending",
    },
    {
      value: "completed",
      label: "completed",
    },
  ];

  return (
    <div class="mx-auto flex w-full justify-center gap-3">
      <For each={filters}>
        {(filter) => (
          <FilterButton
            value={filter.value}
            active={filter.value === props.filter}
          >
            {filter.label}
          </FilterButton>
        )}
      </For>
    </div>
  );
};

interface FilterButtonProps {
  active?: boolean;
  value: string;
}
const FilterButton: ParentComponent<FilterButtonProps> = (props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // TODO: pass correct filter type
    navigate({ to: '/', search: { filter: 'all' }, replace: true });
  };

  return (
    <button
      onClick={handleClick}
      class={cn(
        "bg-background flex-1 cursor-pointer rounded-xs border px-4 py-1 transition-colors",
        {
          "bg-amber-200 font-medium shadow-md": props.active,
          "focus:bg-background focus:text-foreground hover:bg-background hover:text-foreground bg-gray-200/30 text-gray-400":
            !props.active,
        },
      )}
    >
      {props.children}
    </button>
  );
};
