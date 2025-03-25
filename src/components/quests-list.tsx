import {
  closestCenter,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  type DragEventHandler,
  DragOverlay,
  type Id,
  SortableProvider,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
import {
  type Component,
  createSignal,
  ErrorBoundary,
  For,
  type ParentProps,
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
}

export const QuestsList: Component<Props> = (props) => {
  const [items, setItems] = createSignal<Quest[]>(props.quests);

  const [activeItem, setActiveItem] = createSignal<Id | null>(null);
  const ids = () => items().map((item) => item.id as Id);

  const onDragStart: DragEventHandler = ({ draggable }) =>
    setActiveItem(draggable.id);

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (draggable && droppable) {
      const currentItems = ids();
      const fromIndex = currentItems.indexOf(draggable.id);
      const toIndex = currentItems.indexOf(droppable.id);

      if (fromIndex !== toIndex) {
        const updatedItems = currentItems.slice();
        updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));

        updateQuestsOrder({ ids: updatedItems as string[] });

        setItems((prevItems) => {
          const reorderedQuests: Quest[] = [];

          for (const id of updatedItems) {
            const quest = prevItems.find((item) => item.id === id);
            if (quest) {
              reorderedQuests.push(quest);
            }
          }

          return reorderedQuests;
        });
      }
    }
  };

  return (
    <div class="flex h-full flex-col gap-6 overflow-hidden">
      {/* TODO: Show only for today's date */}

      <Filters filter={(props.filter as string) ?? "all"} />

      {/* <Show when={props.quests}> */}
      {/* 	{(quests) => { */}
      {/* 		return ( */}
      {/* 			<Show when={quests()?.length > 0 && isTodaySelected()}> */}
      {/* 				<Filters filter={(props.filter as string) ?? "all"} /> */}
      {/* 			</Show> */}
      {/* 		); */}
      {/* 	}} */}
      {/* </Show> */}

      <ul class="scrollbar-hide flex h-full flex-col gap-1 overflow-y-auto pb-3">
        <ErrorBoundary fallback={<div>Error</div>}>
          <Show when={items().length === 0}>
            <h3 class="text-accent mt-10 h-full text-center text-3xl">
              No quests
            </h3>
          </Show>

          <div class="flex flex-col gap-1">
            <DragDropProvider
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              collisionDetector={closestCenter}
            >
              <DragDropSensors />

              <div class="flex flex-col self-stretch gap-1">
                <SortableProvider ids={ids()}>
                  <For each={items()}>
                    {(item) => {
                      return (
                        <SortableItem item={item}>
                          <QuestCard
                            quest={item}
                            onDeleted={props.onQuestDeleted}
                          />
                        </SortableItem>
                      );
                    }}
                  </For>
                </SortableProvider>
              </div>

              <DragOverlay>
                <div class="bg-background w-[calc(80%)] h-[40px] border p-1 pl-[20px] rounded-xs">
                  {items().find((item) => item.id === activeItem())?.title ??
                    "-"}
                </div>
              </DragOverlay>
            </DragDropProvider>
          </div>
        </ErrorBoundary>
      </ul>
    </div>
  );
};

interface SortableItemProps extends ParentProps {
  item: Quest;
}
const SortableItem: Component<SortableItemProps> = (props) => {
  const sortable = createSortable(props.item.id);
  //@ts-ignore
  const [state] = useDragDropContext();

  return (
    <div
      //@ts-ignore
      use:sortable
      class="sortable"
      classList={{
        "opacity-25": sortable.isActiveDraggable,
        "transition-transform": !!state.active.draggable,
      }}
    >
      {props.children}
    </div>
  );
};
