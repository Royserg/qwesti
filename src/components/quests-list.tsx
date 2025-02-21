import { createAutoAnimate } from "@formkit/auto-animate/solid";
import {
  createAsyncStore,
  useNavigate,
  useSearchParams
} from "@solidjs/router";
import {
  Component,
  ErrorBoundary,
  For,
  ParentComponent,
  Show,
  Suspense,
} from "solid-js";
import { getQuests } from "~/actions";
import { Quest } from "~/bindings";
import { cn } from "~/lib/utils";
import { QuestCard } from "./quest-card";

enum Filter {
  All = "all",
  Active = "active",
  Completed = "completed",
}

interface Props { }
export const QuestsList: Component<Props> = (_props) => {
  const data = createAsyncStore(() => getQuests(), { initialValue: [] });

  const [parent] = createAutoAnimate();
  const [searchParams] = useSearchParams();

  const filteredList = (quests: Quest[]) => {
    if (searchParams.filter === Filter.Active) {
      return quests.filter((quest) => !quest.completed);
    }
    if (searchParams.filter === Filter.Completed) {
      return quests.filter((quest) => quest.completed);
    }

    return quests;
  };

  return (
    <div class="h-full flex flex-col gap-6 overflow-hidden">
      <Show when={data().length > 0}>
        <Filters filter={(searchParams.filter as string) ?? "all"} />
      </Show>

      <ul ref={parent} class="h-full flex flex-col gap-1 overflow-y-auto pb-2 scrollbar-hide">
        <ErrorBoundary fallback={<div>Error</div>}>
          <Show when={filteredList(data()).length === 0}>
            <h3 class="h-full text-center mt-10 text-3xl text-accent">No quests</h3>
          </Show>
          <For each={filteredList(data())}>
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
      value: "active",
      label: "active",
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
    navigate(`?filter=${props.value}`, { replace: true });
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
