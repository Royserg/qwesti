import { createFileRoute, useLocation, useNavigate, useRouter } from '@tanstack/solid-router'
import { addQuest, deleteQuest, loadQuest, loadSubQuests, updateQuestCompleted, updateQuestTitle } from '~/actions';
import ChevronLeft from 'icons/chevron-left';
import { QuestCard } from '~/components/quest-card';
import { BaseLayout } from '~/layouts/base';
import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { cn } from '~/lib/utils';
import { AddQuestDialog } from '~/components/add-quest-dialog/add-quest-dialog';
import { Button } from '~/components/ui/button';
import { Quest } from '~/bindings';
import { DeleteButton } from '~/components/delete-button';


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

  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>()
  // TODO: check if those are needed -> currently editing title doesn't work (add an explicit button)
  const [title, setTitle] = createSignal('title');
  const [titleEditable, setTitleEditable] = createSignal(true);

  // const [quest, { refetch: refetchQuest }] = createResource(() => params.id, async () => await loadQuest({ id: params.id }));
  // const [subQuests, { refetch: refetchSubQuests }] = createResource(() => params().questId, () => loadSubQuests(params().questId));

  const handleBackClick = () => {
    router.history.back();
  }

  const handleTitleChange = async (title: string) => {
    const questId = params().questId;

    if (!questId) {
      return
    }

    try {
      const res = await updateQuestTitle({ questId: questId, title });
      setTitle(res.title);
      // refetchQuest();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async () => {
    const questId = params().questId;
    if (questId) {
      await deleteQuest({ questId });
      // Navigate back
      // navigate('/')
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

      // refetchQuest();
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
      // refetchSubQuests();
      closeDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const closeDialog = () => {
    dialogRef()?.close();
  }


  return (
    <BaseLayout class='flex'>
      {/* temporary for testing */}
      {/* <QuestCard quest={quest()} /> */}
      {/* temporary for testing */}

      <button onClick={handleBackClick} class="w-8 h-full bg-gray-50 flex items-center justify-center cursor-pointer">
        <ChevronLeft class="text-gray-400" />
      </button>

      <div class="flex flex-col pt-3 w-full h-full">
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

          <h2
            class="pl-2 text-3xl w-full flex items-center"
          >
            {data().quest.title}
          </h2>
          {/* <EditableText value={q().title} onSubmit={handleTitleChange} focusable={titleEditable} /> */}

          <DeleteButton
            class="mr-2 p-3"
            onDelete={handleDeleteQuest}
          />
        </div>

        {/* Sub-Quests */}
        <div class="py-2" />
        <SubQuests
          quests={data().subQuests ?? []}
          // onQuestDeleted={refetchSubQuests} 
          onQuestDeleted={() => { }}
        />

        <section class="mt-auto flex h-[60px] w-full items-center justify-center border-t pb-1">
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

      </div>
    </BaseLayout>
  )
}


// -- Sub Quests --
const SubQuests: Component<{
  quests: Quest[],
  onQuestDeleted?: () => void;
}> = (props) => {
  return (
    <section class="flex flex-col gap-2">
      <Show when={props.quests.length > 0}>
        <h3 class="pl-4 text-xl text-muted-foreground">Sub Quests</h3>
        <div class="px-6 flex flex-col gap-1">
          <For each={props.quests}>
            {(item) => <QuestCard quest={item} onDeleted={() => props.onQuestDeleted?.()} />}
          </For>
        </div>
      </Show>
    </section>
  )
}
