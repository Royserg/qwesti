import {
  createEffect,
  createSignal,
  onCleanup,
  type Component,
} from "solid-js";
import { cn } from "~/lib/utils";

interface Props {
  onDelete: () => void;
  tabIndex?: number;
  onDeleteProgressChange?: (progress: number) => void;
  class?: string;
}

export const DeleteButton: Component<Props> = (props) => {
  let deleteConfirmTimeout: ReturnType<typeof setInterval> | null = null;
  const [deleteProgress, setDeleteProgress] = createSignal(0);

  const handlePress = () => {
    if (deleteConfirmTimeout) {
      return;
    }

    deleteConfirmTimeout = setInterval(() => {
      setDeleteProgress((prev) => {
        const next = Math.min(prev + 2, 100);
        props.onDeleteProgressChange?.(next);
        return next;
      });
    }, 20);
  };

  const handleRelease = () => {
    if (deleteConfirmTimeout) {
      clearInterval(deleteConfirmTimeout);
      deleteConfirmTimeout = null;
    }

    setDeleteProgress(0);
    props.onDeleteProgressChange?.(0);
  };

  createEffect(() => {
    if (deleteProgress() >= 100) {
      handleRelease();
      props.onDelete();
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handlePress();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handleRelease();
    }
  };

  onCleanup(() => {
    if (deleteConfirmTimeout) {
      clearInterval(deleteConfirmTimeout);
    }
  });

  return (
    <button
      type="button"
      tabIndex={props.tabIndex ?? 0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerDown={handlePress}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onPointerLeave={handleRelease}
      class={cn("pixel-delete-button focus-visible:z-10", props.class)}
      style={{
        "--delete-progress": `${deleteProgress()}%`,
      }}
      aria-label="Hold to delete task"
      title="Hold to delete"
    />
  );
};
