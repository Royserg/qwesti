import { useNavigate } from "@tanstack/solid-router";
import { type Component, Show } from "solid-js";
import { deleteQuest, updateQuestCompleted } from "~/actions";
import type { Quest } from "~/bindings";
import { PixelTaskRow } from "~/components/pixel-task-row";
import { TaskStatusCell } from "~/components/task-status-cell";
import { cn } from "~/lib/utils";
import { DeleteButton } from "./delete-button";

interface Props {
  quest: Quest;
  onDeleted?: () => void;
  onToggled?: () => void;
}

export const QuestCard: Component<Props> = (props) => {
  const navigate = useNavigate();

  const handleQuestClick = async () => {
    await navigate({ to: "/quests/$questId", params: { questId: props.quest.id } });
  };

  const handleQuestToggle = async () => {
    if (props.quest.hasChildren) {
      return;
    }

    try {
      await updateQuestCompleted({
        questId: props.quest.id,
        completed: !props.quest.completed,
      });

      props.onToggled?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async () => {
    await deleteQuest({ questId: props.quest.id });
    props.onDeleted?.();
  };

  const subQuestsCount = () => (props.quest.children !== null ? props.quest.children.length : 0);
  const subQuestsCompletedCount = () => props.quest.children?.filter((q) => q.completed).length ?? 0;
  const completionPercentage = () =>
    subQuestsCompletedCount() === 0
      ? 0
      : Math.floor((subQuestsCompletedCount() / subQuestsCount()) * 100);

  return (
    <PixelTaskRow
      style={{ "view-transition-name": `quest-${props.quest.id}` }}
      left={
        <Show
          when={props.quest.hasChildren}
          fallback={
            <TaskStatusCell
              completed={props.quest.completed}
              onToggle={handleQuestToggle}
              ariaLabel={props.quest.completed ? "Mark task as pending" : "Mark task as completed"}
            />
          }
        >
          <TaskStatusCell progress={completionPercentage()} />
        </Show>
      }
      right={<DeleteButton onDelete={handleDeleteQuest} />}
    >
      <button
        type="button"
        onClick={handleQuestClick}
        class="drag-handle flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <span
          class={cn("pixel-title", {
            "pixel-title--done": props.quest.completed,
          })}
          title={props.quest.title}
        >
          {props.quest.title}
        </span>
      </button>
    </PixelTaskRow>
  );
};
