import { useNavigate } from "@tanstack/solid-router";
import { type Component, For, type ParentComponent } from "solid-js";
import { cn } from "~/lib/utils";
import { QuestsFilterEnum, type QuestsFilterEnumType } from "~/routes";

// -- Filter Button --
interface FiltersProps {
	filter: string;
}
export const Filters: Component<FiltersProps> = (props) => {
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
	value: QuestsFilterEnumType;
}
const FilterButton: ParentComponent<FilterButtonProps> = (props) => {
	const navigate = useNavigate({ from: "/" });

	const handleClick = () => {
		navigate({ to: "/", search: { filter: props.value }, replace: true });
	};

	return (
		<button
			type="button"
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
