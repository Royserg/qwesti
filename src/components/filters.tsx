import { useNavigate } from "@tanstack/solid-router";
import ChevronDown from 'icons/chevron-down';
import { type Component, createSignal, For, type ParentComponent } from "solid-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
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

  return (
    <div class="mx-auto relative w-full flex justify-end">

      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger class="flex items-center gap-1 bg-amber-200 font-medium rounded-xs text-sm border px-4 py-2 shadow-md transition-colors hover:bg-amber-300">
          <ChevronDown
            class={cn("size-4 transition-transform", {
              "rotate-180": isOpen(),
            })}
          />
          Filters
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup class="flex flex-col p-1 gap-1">
            <For each={filters}>
              {(filter) => (
                <DropdownMenuItem class="p-0">
                  <FilterButton
                    value={filter.value}
                    active={filter.value === props.filter}
                    onClick={() => setIsOpen(false)}
                  >
                    {filter.label}
                  </FilterButton>
                </DropdownMenuItem>
              )}
            </For>
          </DropdownMenuGroup>

        </DropdownMenuContent>
      </DropdownMenu>
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
