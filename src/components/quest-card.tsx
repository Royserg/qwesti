import { createSignal, type Component } from "solid-js";
import { deleteQuest, updateQuestCompleted, updateQuestTitle } from "~/actions";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { DeleteButton } from "./delete-button";
import { EditableText } from "./editable-text";
import { isTodaySelected } from "~/stores/date";
import { useNavigate } from '@solidjs/router'

type FocusOutEvent = FocusEvent & {
  currentTarget: HTMLDivElement;
  target: Element;
};

interface Props {
  quest: Quest;
}

export const QuestCard: Component<Props> = (props) => {
  const navigate = useNavigate();

  let completedBtn!: HTMLButtonElement;
  let card!: HTMLDivElement;

  const [selected, setSelected] = createSignal(false);
  const [completed, setCompleted] = createSignal(props.quest.completed);
  const [title, setTitle] = createSignal(props.quest.title);
  const [deleteProgress, setDeleteProgress] = createSignal(0);

  const handleQuestToggle = async () => {
    try {
      const newCompleted = !completed();

      const res = await updateQuestCompleted({
        questId: props.quest.id,
        completed: newCompleted,
      });
      setCompleted(res.completed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTitleChange = async (title: string) => {
    try {
      const res = await updateQuestTitle({ questId: props.quest.id, title });
      setTitle(res.title);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async () => {
    await deleteQuest({ questId: props.quest.id });
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    // enable children to be focusable
    if (event.key === "Enter") {
      setSelected(true);
      completedBtn.focus();
    }

    if (event.key === "Escape") {
      setSelected(false);
      card.focus();
    }
  };

  const handleFocusOut = (e: FocusOutEvent) => {
    if (!e.relatedTarget) {
      return;
    }

    if (!card.contains(e.relatedTarget as Node)) {
      setSelected(false);
    }
  };

  const deleteBtnLinearGradient = () => {
    return `linear-gradient(
			          0deg,
								var(--color-red-300) 0%,
								var(--color-red-700) ${deleteProgress()}%, var(--color-white) ${deleteProgress() + 2}%
							)`;
  };

  return (
    <Card
      onClick={() => {
        navigate(`/quests/${props.quest.id}`)
      }}
      ref={card}
      class={cn("h-[50px]", {
        "bg-gray-100": selected(),
      })}
      style={{
        background: deleteProgress() > 0
          ? deleteBtnLinearGradient()
          : "var(--color-background)",
      }}
      tabIndex={0}
      onKeyUp={handleKeyUp}
      onFocusOut={handleFocusOut}
    >
      <CardContent class="flex h-full w-full justify-start align-middle p-0">
        <button
          ref={completedBtn}
          tabIndex={selected() ? 0 : -1}
          type="button"
          class={cn(
            "cursor-pointer flex justify-center w-12 shadow-inner shadow-black/20",
            {
              "bg-amber-300": completed(),
              "bg-card": !completed(),
              "border-8 border-gray-200 cursor-not-allowed": !isTodaySelected(),
            },
          )}
          onClick={handleQuestToggle}
          disabled={!isTodaySelected()}
        />

        <div class="w-full h-full flex p-3 pr-3 gap-2 items-center">
          <EditableText
            value={title()}
            focusable={selected}
            onSubmit={handleTitleChange}
          />

          <DeleteButton
            tabIndex={selected() ? 0 : -1}
            onDelete={handleDeleteQuest}
            onDeleteProgressChange={setDeleteProgress}
          />
        </div>
      </CardContent>
    </Card>
  );
};
