import { animations } from "@formkit/drag-and-drop";
import { useDragAndDrop } from "@formkit/drag-and-drop/solid";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/solid-router";
import ChevronLeft from "icons/chevron-left";
import { Component, createSignal, For, Match, Show, Switch } from "solid-js";
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

export const Route = createFileRoute("/quests/$questId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [quest, subQuests] = await Promise.all([
      loadQuest({ id: params.questId }),
      loadSubQuests(params.questId),
    ]);
    return { quest, subQuests };
  },

  // Needed to reload data when using `history.back()` call
  // Do not cache this route's data after it's unloaded
  gcTime: 0,
  // Only reload the route when the user navigates to it or when deps change
  shouldReload: false,
});

function RouteComponent() {
  const params = Route.useParams();
  const data = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate({ from: "/quests/$questId" });

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
    const currentQuest = data().quest;
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

  const handleAddQuest = async (title: string) => {
    const questId = params().questId;
    if (!questId) {
      return;
    }

    try {
      // pass in parent id
      await addQuest({ title, parentId: questId });
      router.invalidate();
      closeDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const closeDialog = () => {
    dialogRef()?.close();
  };

  const handleSubQuestDeleted = () => {
    router.invalidate();
  };

  const subQuestsCount = () => data().subQuests.length;
  const subQuestsCompletedCount = () =>
    data().subQuests.filter((q) => q.completed).length ?? 0;
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
              <Match when={data().subQuests.length === 0}>
                <button
                  type="button"
                  class={cn(
                    "flex h-full w-12 cursor-pointer justify-center border shadow-inner shadow-black/20",
                    {
                      "bg-amber-300": data().quest.completed,
                      "bg-card": !data().quest.completed,
                    },
                  )}
                  onClick={handleQuestToggle}
                />
              </Match>
              <Match when={data().subQuests.length > 0}>
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
              value={data().quest.title}
              onSubmit={handleTitleChange}
              focusable={() => true}
            />

            <DeleteButton class="mr-2 p-3" onDelete={handleDeleteQuest} />
          </div>

          {/* Sub-Quests */}
          <div class="py-2" />
          <SubQuests
            quests={data().subQuests ?? []}
            onQuestDeleted={handleSubQuestDeleted}
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
        onSubmit={handleAddQuest}
        onClose={closeDialog}
      />
    </BaseLayout>
  );
}

// -- Sub Quests --
const SubQuests: Component<{
  quests: Quest[];
  onQuestDeleted?: () => void;
}> = (props) => {
  const [questsContainer, quests] = useDragAndDrop<HTMLDivElement, Quest>(
    props.quests,
    {
      dragHandle: ".drag-handle",
      onDragend: async (data) => {
        const ids = (data.values as Quest[]).map((q) => q.id);
        await updateQuestsOrder({ ids });
      },
      // NOTE: without this QuestCard delete button doesnt fire Pointer events
      handleNodePointerdown: (_data) => { },
      handleNodePointerup: (_data) => { },
      handlePointercancel: (_data) => { },
      plugins: [animations()],
    },
  );

  return (
    <section
      class="flex flex-1 flex-col gap-2 overflow-auto"
      style={{ "view-transition-name": "sub-quests-container" }}
    >
      <Show when={props.quests.length > 0}>
        <h3 class="text-muted-foreground pl-4 text-xl">Sub Quests</h3>
        <div ref={questsContainer} class="flex flex-col gap-1 px-6 pb-3">
          <For each={quests()}>
            {(q) => (
              <QuestCard
                data-label={q.id}
                quest={q}
                onDeleted={() => props.onQuestDeleted?.()}
              />
            )}
          </For>
        </div>
      </Show>
    </section>
  );
};
