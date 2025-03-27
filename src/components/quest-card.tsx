import { useNavigate, useRouter } from "@tanstack/solid-router";
import { createSignal, type Component } from "solid-js";
import { deleteQuest, updateQuestCompleted } from "~/actions";
import type { Quest } from "~/bindings";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { isTodaySelected } from "~/stores/date";
import { DeleteButton } from "./delete-button";

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
  const router = useRouter();

  let completedBtn!: HTMLButtonElement;

  let card!: HTMLDivElement;

  const [selected, setSelected] = createSignal(false);
  const [completed, setCompleted] = createSignal(props.quest.completed);
  const [deleteProgress, setDeleteProgress] = createSignal(0);

  const handleQuestClick = () => {
    navigate({ to: "/quests/$questId", params: { questId: props.quest.id } });
  };

  const handleQuestToggle = async () => {
    try {
      const newCompleted = !completed();

      const res = await updateQuestCompleted({
        questId: props.quest.id,
        completed: newCompleted,
      });

      setCompleted(res.completed);
      router.invalidate();
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
        // "bg-gray-100": selected(), // NOTE: doesn't take effect because of style below
      })}
      style={{
        "view-transition-name": `quest-${props.quest.id}`,
        contain: "layout",
        background:
          deleteProgress() > 0
            ? deleteBtnLinearGradient()
            : "var(--color-background)",
      }}
      tabIndex={0}
      onKeyUp={handleKeyUp}
      onFocusOut={handleFocusOut}
    >
      <CardContent
        class={cn("flex h-full w-full justify-start p-0 align-middle")}
      >
        <button
          ref={completedBtn}
          tabIndex={selected() ? 0 : -1}
          type="button"
          class={cn(
            "flex w-12 cursor-pointer justify-center inset-shadow-sm inset-shadow-black/20",
            {
              "bg-amber-300": completed(),
              "bg-card": !completed(),
              "cursor-not-allowed border-8 border-gray-200": !isTodaySelected(),
            },
          )}
          onClick={handleQuestToggle}
          disabled={!isTodaySelected()}
        />

        <div class={cn("flex h-full w-full items-center gap-2 bg-background")}>
          <button
            type="button"
            onClick={handleQuestClick}
            class="drag-handle flex h-full w-full cursor-pointer items-center pl-4"
          >
            {props.quest.title}
          </button>

          <div class="grid place-items-center p-3">
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
