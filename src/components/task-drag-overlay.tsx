import type { Component } from "solid-js";

import { cn } from "~/lib/utils";
import { PixelTaskRow } from "./pixel-task-row";
import { TaskStatusCell } from "./task-status-cell";

interface Props {
  title: string;
  completed: boolean;
  progress?: number;
}

export const TaskDragOverlay: Component<Props> = (props) => {
  return (
    <div class="pixel-drag-overlay-shell">
      <PixelTaskRow
        left={
          props.progress !== undefined
            ? <TaskStatusCell progress={props.progress} />
            : <TaskStatusCell completed={props.completed} />
        }
        right={<div class="pixel-delete-button pixel-delete-button--static" aria-hidden="true" />}
      >
        <div class="flex min-w-0 flex-1 items-center px-4 py-2.5">
          <span
            class={cn("pixel-title", {
              "pixel-title--done": props.completed,
            })}
            title={props.title}
          >
            {props.title}
          </span>
        </div>
      </PixelTaskRow>
    </div>
  );
};
