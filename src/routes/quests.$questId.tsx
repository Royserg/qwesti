import { animations } from "@formkit/drag-and-drop";
import { useDragAndDrop } from "@formkit/drag-and-drop/solid";
import { createFileRoute, useNavigate, useRouter } from '@tanstack/solid-router';
import ChevronLeft from 'icons/chevron-left';
import { Component, createSignal, For, Show } from 'solid-js';
import { addQuest, deleteQuest, loadQuest, loadSubQuests, updateQuestCompleted, updateQuestTitle } from '~/actions';
import { updateQuestsOrder } from '~/actions/update-quests-order';
import { Quest } from '~/bindings';
import { AddQuestDialog } from '~/components/add-quest-dialog/add-quest-dialog';
import { DeleteButton } from '~/components/delete-button';
import { EditableText } from '~/components/editable-text';
import { QuestCard } from '~/components/quest-card';
import { Button } from '~/components/ui/button';
import { BaseLayout } from '~/layouts/base';
import { cn } from '~/lib/utils';


export const Route = createFileRoute('/quests/$questId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [quest, subQuests] = await Promise.all([
      loadQuest({ id: params.questId }),
      loadSubQuests(params.questId)
    ]);
    return { quest, subQuests };
  },
})

function RouteComponent() {
  const params = Route.useParams();
  const data = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate({ from: '/quests/$questId' })

  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>()

  const handleBackClick = () => {
    if (router.history.canGoBack()) {
      router.history.back()
    } else {
      navigate({ to: '/' });
    }

    // const parentId = data().quest.parentId;
    // if (parentId) {
    //   navigate({ to: '/quests/$questId', params: { questId: parentId } });
    // } else {
    //   navigate({ to: '/' });
    // }
  }

  const handleTitleChange = async (title: string) => {
    const questId = params().questId;

    if (!questId) {
      return
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
        router.history.back()
      } else {
        navigate({ to: '/' });
      }
    }
  };

  const handleQuestToggle = async () => {
    const currentQuest = data().quest;
    if (!currentQuest) {
      return
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
      return
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
  }

  const handleSubQuestDeleted = () => {
    router.invalidate();
  }

  return (
    <BaseLayout class='flex flex-col'>
      <div class='flex h-[calc(100%-70px)]'>
        <button onClick={handleBackClick} class="w-4 h-full bg-gray-50 flex items-center justify-center cursor-pointer border-r">
          <ChevronLeft class="text-gray-600" />
        </button>

        <div class="h-full w-full flex flex-col pt-3">
          <div
            style={{
              contain: 'layout',
              'view-transition-name': `quest-${params().questId}`,
            }}
            class="flex gap-6 h-12 w-full items-center pb-2 border-b border-b-secondary px-4"
          >
            <button
              type="button"
              class={cn(
                "cursor-pointer flex justify-center w-12 h-full shadow-inner shadow-black/20 border",
                {
                  "bg-amber-300": data().quest.completed,
                  "bg-card": !data().quest.completed,
                },
              )}
              onClick={handleQuestToggle}
            />

            <EditableText value={data().quest.title} onSubmit={handleTitleChange} focusable={() => true} />

            <DeleteButton
              class="mr-2 p-3"
              onDelete={handleDeleteQuest}
            />
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
          'view-transition-name': 'bottom-bar'
        }}
        class="bg-background mt-auto flex h-[80px] w-full items-center justify-center border-t pb-1"
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
  )
}


// -- Sub Quests --
const SubQuests: Component<{
  quests: Quest[],
  onQuestDeleted?: () => void;
}> = (props) => {

  const [questsContainer, quests] = useDragAndDrop<HTMLDivElement, Quest>(props.quests, {
    dragHandle: '.drag-handle',
    onDragend: async (data) => {
      const ids = (data.values as Quest[]).map(q => q.id)
      await updateQuestsOrder({ ids })
    },
    // NOTE: without this QuestCard delete button doesnt fire Pointer events
    handleNodePointerdown: (_data) => {
    },
    handleNodePointerup: (_data) => {
    },
    handlePointercancel: (_data) => {
    },
    plugins: [animations()]
  })

  return (
    <section class="flex flex-1 flex-col gap-2 overflow-auto">
      <Show when={props.quests.length > 0}>
        <h3 class="pl-4 text-xl text-muted-foreground">Sub Quests</h3>
        <div ref={questsContainer} class="px-6 flex flex-col gap-1 pb-3">
          <For each={quests()}>
            {(q) => <QuestCard data-label={q.id} quest={q} onDeleted={() => props.onQuestDeleted?.()} />}
          </For>
        </div>
      </Show>
    </section>
  )
}
