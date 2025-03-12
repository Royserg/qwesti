import { createSignal, type Component } from "solid-js";
import { deleteQuest, updateQuestCompleted } from "~/actions";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { isTodaySelected } from "~/stores/date";
import { DeleteButton } from "./delete-button";
import { useNavigate } from "@tanstack/solid-router";

type FocusOutEvent = FocusEvent & {
  currentTarget: HTMLDivElement;
  target: Element;
};

interface Props {
  quest: Quest;
  onDeleted?: () => void;
}

export const QuestCard: Component<Props> = (props) => {
  const navigate = useNavigate();

  let completedBtn!: HTMLButtonElement;
  let card!: HTMLDivElement;

  const [selected, setSelected] = createSignal(false);
  const [completed, setCompleted] = createSignal(props.quest.completed);
  const [deleteProgress, setDeleteProgress] = createSignal(0);

  const handleQuestClick = () => {
    navigate({ to: '/quests/$questId', params: { questId: props.quest.id } })
  }

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

  const handleDeleteQuest = async () => {
    await deleteQuest({ questId: props.quest.id });
    props.onDeleted?.();
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
      ref={card}
      class={cn("h-[50px]", {
        "bg-gray-100": selected(),
      })}
      style={{
        'view-transition-name': `quest-${props.quest.id}`,
        contain: 'layout',
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

        <div class="w-full h-full flex gap-2 items-center">
          <button
            onClick={handleQuestClick}
            class="w-full h-full pl-4 flex items-center cursor-pointer"
          >
            {props.quest.title}
          </button>

          <div class="p-3 grid place-items-center">
            <DeleteButton
              tabIndex={selected() ? 0 : -1}
              onDelete={handleDeleteQuest}
              onDeleteProgressChange={setDeleteProgress}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
