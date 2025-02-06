import {
  createEffect,
  createSignal,
  onCleanup,
  type Component,
} from "solid-js";

interface Props {
  onDelete: () => void;
  tabIndex?: number;
}

export const DeleteButton: Component<Props> = (props) => {
  let deleteConfirmTimeout: NodeJS.Timeout | null;
  const [deleteBtnPressed, setDeleteButtonPressed] = createSignal(false);
  const [deleteProgress, setDeleteProgress] = createSignal(0); // percent progress - bg gradient

  const handlePress = () => {
    setDeleteButtonPressed(true);

    deleteConfirmTimeout = setInterval(() => {
      setDeleteProgress((prev) => {
        if (prev < 100) {
          return prev + 2;
        }
        return prev;
      });
    }, 20);
  };

  const handleRelease = () => {
    setDeleteButtonPressed(false);
    // Reset delete confirm progress
    if (deleteConfirmTimeout) {
      clearTimeout(deleteConfirmTimeout);
      deleteConfirmTimeout = null;
    }
    setDeleteProgress(0);
  };

  createEffect(() => {
    if (deleteProgress() >= 100) {
      props.onDelete();
      setDeleteProgress(0);
    }
  });

  const deleteBtnLinearGradient = () => {
    return `linear-gradient(
			          0deg,
								var(--color-red-800) 0%,
								var(--color-red-800) ${deleteProgress()}%, var(--color-white) ${deleteProgress() + 2}%
							)`;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      if (deleteConfirmTimeout) {
        clearTimeout(deleteConfirmTimeout);
      }
      deleteConfirmTimeout = null;
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
      clearTimeout(deleteConfirmTimeout);
    }
  });

  return (
    <button
      type="button"
      tabIndex={props.tabIndex ?? 0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      style={{
        background: deleteBtnPressed()
          ? deleteBtnLinearGradient()
          : "var(--color-red-300)",
      }}
      class="w-5 h-5 ml-auto cursor-pointer border-1"
    />
  );
};
