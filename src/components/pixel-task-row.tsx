import type { ComponentProps, JSX, ParentProps } from "solid-js";
import { Show, splitProps } from "solid-js";

import { cn } from "~/lib/utils";

interface PixelTaskRowProps extends ParentProps, ComponentProps<"div"> {
  left: JSX.Element;
  right?: JSX.Element;
  leftClass?: string;
  centerClass?: string;
  rightClass?: string;
}

export const PixelTaskRow = (props: PixelTaskRowProps) => {
  const [local, rest] = splitProps(props, [
    "children",
    "left",
    "right",
    "class",
    "leftClass",
    "centerClass",
    "rightClass",
  ]);

  return (
    <div class={cn("pixel-task-row", local.class)} {...rest}>
      <div class={cn("pixel-task-row__left", local.leftClass)}>{local.left}</div>
      <div class={cn("pixel-task-row__center", local.centerClass)}>{local.children}</div>
      <Show when={local.right}>
        <div class={cn("pixel-task-row__right", local.rightClass)}>{local.right}</div>
      </Show>
    </div>
  );
};
