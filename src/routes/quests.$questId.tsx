import { animations, insert } from "@formkit/drag-and-drop";
import { useDragAndDrop, dragAndDrop } from "@formkit/drag-and-drop/solid";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/solid-router";
import ChevronLeft from "icons/chevron-left";
import { Accessor, Component, createEffect, createSignal, For, Match, onMount, Show, Switch } from "solid-js";
import {
  addQuest,
  deleteQuest,
  loadQuest,
  loadSubQuests,
  updateQuestCompleted,
  updateQuestTitle,
} from "~/actions";
import { updateQuestsOrder } from "~/actions/update-quests-order";
import { Quest } from "~/bindings";
import { AddQuestDialog } from "~/components/add-quest-dialog/add-quest-dialog";
import { DeleteButton } from "~/components/delete-button";
import { EditableText } from "~/components/editable-text";
import { QuestCard } from "~/components/quest-card";
import { Button } from "~/components/ui/button";
import { BaseLayout } from "~/layouts/base";
import { cn } from "~/lib/utils";
import {
  queryOptions,
  useQuery,
} from '@tanstack/solid-query'
import { queryClient } from "./__root";


const questQueryOptions = (questId: string) => queryOptions({
  queryKey: ['quest', questId],
  queryFn: () => loadQuest({ id: questId }),
})
const subQuestsQueryOptions = (questId: string) => queryOptions({
  queryKey: ['subQuests', questId],
  queryFn: () => loadSubQuests(questId),
})

export const Route = createFileRoute("/quests/$questId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(questQueryOptions(params.questId))
    await queryClient.ensureQueryData(subQuestsQueryOptions(params.questId))
  },
  // NOTE: Needed to reload data when using `history.back()` call
  // Do not cache this route's data after it's unloaded
  gcTime: 0,
  // Only reload the route when the user navigates to it or when deps change
  shouldReload: false,
});

function RouteComponent() {
  const params = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate({ from: "/quests/$questId" });

  const questQuery = useQuery(() => questQueryOptions(params().questId))
  const subQuestsQuery = useQuery(() => subQuestsQueryOptions(params().questId))

  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

  const handleBackClick = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  const handleTitleChange = async (title: string) => {
    const questId = params().questId;

    if (!questId) {
      return;
    }

    try {
      await updateQuestTitle({ questId: questId, title });
      router.invalidate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async () => {
    const questId = params().questId;
    if (questId) {
      await deleteQuest({ questId });

      if (router.history.canGoBack()) {
        router.history.back();
      } else {
        navigate({ to: "/" });
      }
    }
  };

  const handleQuestToggle = async () => {
    const currentQuest = questQuery.data;
    if (!currentQuest) {
      return;
    }

    try {
      const nextCompleted = !currentQuest.completed;
      await updateQuestCompleted({
        questId: currentQuest.id,
        completed: nextCompleted,
      });

      router.invalidate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubQuest = async (title: string) => {
    const questId = params().questId;
    if (!questId) {
      return;
    }

    try {
      // pass in parent id
      await addQuest({ title, parentId: questId });
      subQuestsQuery.refetch();
      closeDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const closeDialog = () => {
    dialogRef()?.close();
  };

  const handleSubQuestDeleted = () => {
    subQuestsQuery.refetch();
  };

  const handleSubQuestToggled = (_id: string) => {
    subQuestsQuery.refetch();
  }

  const subQuestsCount = () => subQuestsQuery.data?.length ?? 0;
  const subQuestsCompletedCount = () => subQuestsQuery.data?.filter((q) => q.completed).length ?? 0;
  const completionPercentage = () =>
    subQuestsCompletedCount() === 0
      ? 0
      : Math.floor((subQuestsCompletedCount() / subQuestsCount()) * 100);
  const completionBgGradient = () => {
    if (subQuestsCompletedCount() === 0) {
      return "var(--color-white)";
    }
    return `linear-gradient(
                0deg,
                var(--color-amber-300) 0%,
                var(--color-amber-400) ${completionPercentage()}%,
                var(--color-white) ${completionPercentage() + 2}%
              )`;
  };

  return (
    <BaseLayout class="flex flex-col">
      <div class="flex h-[calc(100%-70px)]">
        <button
          onClick={handleBackClick}
          class="flex h-full w-4 cursor-pointer items-center justify-center border-r bg-gray-50"
        >
          <ChevronLeft class="text-gray-600" />
        </button>

        <div class="flex h-full w-full flex-col pt-3">
          <div
            style={{
              contain: "layout",
              "view-transition-name": `quest-${params().questId}`,
            }}
            class="border-b-secondary flex h-12 w-full items-center gap-6 border-b px-4 pb-2"
          >
            <Switch>
              <Match when={subQuestsQuery.data?.length === 0}>
                <button
                  type="button"
                  class={cn(
                    "flex h-full w-12 cursor-pointer justify-center border shadow-inner shadow-black/20",
                    {
                      "bg-amber-300": questQuery.data?.completed,
                      "bg-card": !questQuery.data?.completed,
                    },
                  )}
                  onClick={handleQuestToggle}
                />
              </Match>

              <Match when={subQuestsQuery.data?.length && subQuestsQuery.data?.length > 0}>
                <div
                  class="group grid h-full w-14 place-items-center inset-shadow-sm inset-shadow-black/20"
                  style={{
                    background: completionBgGradient(),
                  }}
                >
                  <p class="invisible group-hover:visible">
                    {completionPercentage()}%
                  </p>
                </div>
              </Match>
            </Switch>

            <EditableText
              value={questQuery.data?.title ?? ''}
              onSubmit={handleTitleChange}
              focusable={() => true}
            />

            <DeleteButton class="mr-2 p-3" onDelete={handleDeleteQuest} />
          </div>

          {/* Sub-Quests */}
          <div class="py-2" />
          <SubQuests
            quests={subQuestsQuery.data ?? []}
            onQuestDeleted={handleSubQuestDeleted}
            onQuestToggled={handleSubQuestToggled}
            onOrderChanged={() => subQuestsQuery.refetch()}
          />
        </div>
      </div>

      <section
        style={{
          "view-transition-name": "bottom-bar",
        }}
        class="bg-background animate-in slide-in-from-bottom-5 mt-auto flex h-[70px] w-full items-center justify-center border-t pb-1 rounded-t-xs"
      >
        <Button
          class="h-[50px] w-3/5 rounded-xs"
          onClick={() => {
            dialogRef()?.showModal();
          }}
        >
          Add Sub Quest
        </Button>
      </section>

      <AddQuestDialog
        dialogRef={setDialogRef}
        onSubmit={handleAddSubQuest}
        onClose={closeDialog}
      />
    </BaseLayout>
  );
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

// -- Sub Quests --
const SubQuests: Component<{
  quests: Quest[];
  onQuestDeleted?: (id: string) => void;
  onQuestToggled?: (id: string) => void;
  onOrderChanged?: () => void;
}> = (props) => {

  let questsContainer!: HTMLDivElement;

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

  const onQuestDeleted = (id: string) => {
    props.onQuestDeleted?.(id);
  }
  const onQuestToggled = (id: string) => {
    props.onQuestToggled?.(id);
  }

  return (
    <section
      class="flex flex-1 flex-col gap-2 overflow-auto"
      style={{ "view-transition-name": "sub-quests-container" }}
    >
      <Show when={props.quests.length > 0}>
        <h3 class="text-muted-foreground pl-4 text-xl">Sub Quests</h3>
        <div ref={questsContainer} class="flex flex-col gap-1 px-6 pb-3">
          <For each={props.quests}>
            {(q) => (
              <QuestCard
                data-label={q.id}
                quest={q}
                onDeleted={() => onQuestDeleted(q.id)}
                onToggled={() => onQuestToggled(q.id)}
              />
            )}
          </For>
        </div>
      </Show>
    </section>
  );
};
