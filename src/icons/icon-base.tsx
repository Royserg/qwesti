import type { ComponentProps } from "solid-js";

import { cn } from "~/lib/utils";

export const iconBaseClass = "pixel-icon size-4 shrink-0";

export const IconBase = (props: ComponentProps<"svg">) => {
  const { class: className, children, ...rest } = props;

  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shape-rendering="crispEdges"
      class={cn(iconBaseClass, className)}
      {...rest}
    >
      {children}
    </svg>
  );
};
