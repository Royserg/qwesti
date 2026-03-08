import { useNavigate } from "@tanstack/solid-router";
import ChevronDown from "icons/chevron-down";
import {
  type Component,
  createSignal,
  For,
  type ParentComponent,
} from "solid-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { QuestsFilterEnum, type QuestsFilterEnumType } from "~/routes";

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
    <div class="relative mx-auto flex w-full justify-end">
      <div class="flex items-center gap-2">
        <span class="pixel-tag min-h-[34px] min-w-[68px] justify-center px-3 text-[0.68rem]">
          {props.filter}
        </span>

        <DropdownMenu onOpenChange={setIsOpen}>
          <DropdownMenuTrigger class="pixel-inline-button gap-2 px-4">
            <ChevronDown
              class={cn("size-4 transition-transform duration-100", {
                "rotate-180": isOpen(),
              })}
            />
            filters
          </DropdownMenuTrigger>

          <DropdownMenuContent class="w-[180px]">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup class="flex flex-col gap-1 p-1">
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
    navigate({
      to: "/",
      search: (prev) => ({ ...prev, filter: props.value }),
      replace: true,
    });
    props.onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class={cn(
        "type-copy flex w-full cursor-pointer items-center justify-between border-2 px-3 py-2 text-left text-sm transition-colors",
        {
          "bg-[var(--accent-soft-color)]": props.active,
          "bg-[var(--panel-color)] hover:bg-[var(--panel-muted-color)]": !props.active,
        },
      )}
    >
      <span>{props.children}</span>
      <span class="type-pixel text-[0.62rem]">{props.active ? "on" : ""}</span>
    </button>
  );
};
