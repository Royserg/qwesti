import { useNavigate } from "@tanstack/solid-router";
import ChevronDown from 'icons/chevron-down';
import { type Component, createSignal, For, type ParentComponent, Show } from "solid-js";
import { Transition } from "solid-transition-group";
import { cn } from "~/lib/utils";
import { QuestsFilterEnum, type QuestsFilterEnumType } from "~/routes";

// -- Filter Button --
interface FiltersProps {
  filter: string;
}
export const Filters: Component<FiltersProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  const filters = [
    {
      value: QuestsFilterEnum.enum.all,
      label: "all",
    },
    {
      value: QuestsFilterEnum.enum.pending,
      label: "pending",
    },
    {
      value: QuestsFilterEnum.enum.completed,
      label: "completed",
    },
  ];

  const toggleFilters = () => setIsOpen(!isOpen());

  return (
    <div class="mx-auto relative w-full flex justify-end">
      <button
        onClick={toggleFilters}
        class="bg-amber-200 font-medium rounded-xs text-sm border px-6 py-2 shadow-md transition-colors hover:bg-amber-300 flex items-center gap-2"
      >
        <ChevronDown
          class={cn("size-4 transition-transform", {
            "rotate-180": isOpen(),
          })}
        />
        Filters
      </button>

      {/* TODO: use dropdown element from shadcn */}
      <Transition
        enterActiveClass="transition ease-out duration-200"
        enterClass="opacity-0 scale-95"
        enterToClass="opacity-100 scale-100"
        exitActiveClass="transition ease-in duration-150"
        exitClass="opacity-100 scale-100"
        exitToClass="opacity-0 scale-95"
      >
        <Show when={isOpen()}>
          <div class="absolute top-12 z-10 mt-1 w-full max-w-[250px] rounded-xs border bg-white shadow-lg p-2">
            <div class="flex flex-col gap-1">
              <For each={filters}>
                {(filter) => (
                  <FilterButton
                    value={filter.value}
                    active={filter.value === props.filter}
                    onClick={() => setIsOpen(false)}
                  >
                    {filter.label}
                  </FilterButton>
                )}
              </For>
            </div>
          </div>
        </Show>
      </Transition>
    </div>
  );
};

interface FilterButtonProps {
  active?: boolean;
  value: QuestsFilterEnumType;
  onClick?: () => void;
}
const FilterButton: ParentComponent<FilterButtonProps> = (props) => {
  const navigate = useNavigate({ from: "/" });

  const handleClick = () => {
    navigate({ to: "/", search: (prev) => ({ ...prev, filter: props.value }), replace: true });
    if (props.onClick) props.onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class={cn(
        "w-full cursor-pointer rounded-xs border px-4 py-2 transition-colors text-left",
        {
          "bg-amber-200 font-medium shadow-md": props.active,
          "hover:bg-gray-100 bg-white text-gray-700":
            !props.active,
        },
      )}
    >
      {props.children}
    </button>
  );
};
