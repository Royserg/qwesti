import { A, createAsync, useNavigate, useParams } from "@solidjs/router";
import { Component, createMemo, createResource, createSignal, For, Show } from "solid-js"
import { addQuest, deleteQuest, loadQuest, loadSubQuests, updateQuestCompleted, updateQuestTitle } from "~/actions";
import { BaseLayout } from "~/layouts/base";
import { cn } from "~/lib/utils";
import ChevronLeft from 'icons/chevron-left';
import { DeleteButton } from "~/components/delete-button";
import { EditableText } from "~/components/editable-text";
import { Button } from "~/components/ui/button";
import { AddQuestDialog } from "~/components/add-quest-dialog/add-quest-dialog";
import { QuestCard } from "~/components/quest-card";
import { Quest } from "~/bindings";

const QuestDetails: Component = () => {
  const navigate = useNavigate();
  const params = useParams();

  // Data
  const [quest, { refetch: refetchQuest }] = createResource(() => params.id, async () => await loadQuest({ id: params.id }));
  const [subQuests, { refetch: refetchSubQuests }] = createResource(() => params.id, () => loadSubQuests(params.id));

  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>()
  // TODO: check if those are needed -> currently editing title doesn't work (add an explicit button)
  const [title, setTitle] = createSignal('title');
  const [titleEditable, setTitleEditable] = createSignal(true);

  const handleTitleChange = async (title: string) => {
    const currentQuest = quest();
    if (!currentQuest) {
      return
    }

    try {
      const res = await updateQuestTitle({ questId: currentQuest.id, title });
      setTitle(res.title);
      refetchQuest();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async () => {
    const questId = quest()?.id;
    if (questId) {
      await deleteQuest({ questId });
      // Navigate back
      navigate('/')
    }
  };

  const handleQuestToggle = async () => {
    const currentQuest = quest();
    if (!currentQuest) {
      return
    }

    try {
      const nextCompleted = !currentQuest.completed;
      await updateQuestCompleted({
        questId: currentQuest.id,
        completed: nextCompleted,
      });

      refetchQuest();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuest = async (title: string) => {
    const currentQuest = quest();
    if (!currentQuest) {
      return
    }

    try {
      // pass in parent id
      await addQuest({ title, parentId: currentQuest.id });
      refetchSubQuests();
      closeDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const closeDialog = () => {
    dialogRef()?.close();
  }

  const handleBackClick = () => {
    window.history.back();
  }

  return (
    <BaseLayout class="flex">
      <button onClick={handleBackClick} class="w-8 h-full bg-gray-50 flex items-center justify-center cursor-pointer">
        <ChevronLeft class="text-gray-400" />
      </button>

      <Show when={quest()}>
        {(q) => {
          return (
            <div class="flex flex-col pt-3 w-full h-full">

              {/* Header */}
              <div class="flex gap-6 h-12 w-full items-center pb-2 border-b border-b-secondary px-4">
                <button
                  type="button"
                  class={cn(
                    "cursor-pointer flex justify-center w-12 h-full shadow-inner shadow-black/20 border",
                    {
                      "bg-amber-300": q().completed,
                      "bg-card": !q().completed,
                    },
                  )}
                  onClick={handleQuestToggle}
                />

                {/* <h2 class="pl-2 text-3xl w-full flex items-center">{q().title}</h2> */}
                <EditableText value={q().title} onSubmit={handleTitleChange} focusable={titleEditable} />

                <DeleteButton
                  class="mr-2 p-3"
                  onDelete={handleDeleteQuest}
                />
              </div>

              {/* Sub-Quests */}
              <div class="py-2" />
              <SubQuests quests={subQuests() ?? []} onQuestDeleted={refetchSubQuests} />

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
          )
        }}
      </Show>
    </BaseLayout>
  )
}

export default QuestDetails;

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

