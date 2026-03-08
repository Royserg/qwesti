import { Show, type Component } from "solid-js";

import { cn } from "~/lib/utils";

interface TaskStatusCellProps {
  completed?: boolean;
  progress?: number;
  onToggle?: () => void;
  class?: string;
  ariaLabel?: string;
}

const clampProgress = (value: number) => {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.floor(value);
};

export const TaskStatusCell: Component<TaskStatusCellProps> = (props) => {
  const progress = () => clampProgress(props.progress ?? 0);

  return (
    <Show
      when={props.progress !== undefined}
      fallback={
        props.onToggle ? (
          <button
            type="button"
            class={cn("pixel-status-box", {
              "pixel-status-box--tile": true,
            }, props.class)}
            onClick={props.onToggle}
            aria-label={props.ariaLabel}
            children={
              <span
                class={cn("pixel-status-box__surface", {
                  "pixel-status-box__surface--done": props.completed,
                })}
              />
            }
          />
        ) : (
          <div
            class={cn("pixel-status-box pixel-status-box--static", {
              "pixel-status-box--tile": true,
            }, props.class)}
            aria-hidden="true"
            children={
              <span
                class={cn("pixel-status-box__surface", {
                  "pixel-status-box__surface--done": props.completed,
                })}
              />
            }
          />
        )
      }
    >
      <Show
        when={props.onToggle}
        fallback={
          <div class={cn("pixel-progress-box grid place-items-center", props.class)} aria-hidden="true">
            <span class="pixel-progress-box__value">{progress()}%</span>
            <div class="pixel-progress-box__track">
              <div
                class="pixel-progress-box__fill"
                style={{ width: `${progress()}%` }}
              />
            </div>
          </div>
        }
      >
        <button
          type="button"
          class={cn("pixel-progress-box grid place-items-center", props.class)}
          onClick={props.onToggle}
          aria-label={props.ariaLabel}
        >
          <span class="pixel-progress-box__value">{progress()}%</span>
          <div class="pixel-progress-box__track">
            <div
              class="pixel-progress-box__fill"
              style={{ width: `${progress()}%` }}
            />
          </div>
        </button>
      </Show>
    </Show>
  );
};
