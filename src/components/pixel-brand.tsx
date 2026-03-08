import type { ComponentProps } from "solid-js";

import { cn } from "~/lib/utils";

export const PixelBrand = (props: ComponentProps<"svg">) => {
  const { class: className, ...rest } = props;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      shape-rendering="crispEdges"
      class={cn("pixel-brand", className)}
      {...rest}
    >
      <rect x="7" y="2" width="18" height="2" fill="var(--ink-color)" />
      <rect x="5" y="4" width="22" height="2" fill="var(--ink-color)" />
      <rect x="4" y="6" width="24" height="2" fill="var(--ink-color)" />
      <rect x="6" y="8" width="20" height="2" fill="var(--muted-color)" />
      <rect x="8" y="10" width="16" height="2" fill="var(--accent-color)" />
      <rect x="10" y="12" width="12" height="2" fill="var(--accent-dark-color)" />
      <rect x="12" y="14" width="8" height="2" fill="var(--ink-color)" />
      <rect x="12" y="16" width="8" height="2" fill="var(--ink-color)" />
      <rect x="11" y="18" width="10" height="2" fill="var(--ink-color)" />
      <rect x="10" y="20" width="12" height="2" fill="var(--ink-color)" />
      <rect x="9" y="22" width="14" height="2" fill="var(--ink-color)" />
      <rect x="11" y="24" width="10" height="2" fill="var(--ink-color)" />
      <rect x="13" y="26" width="6" height="2" fill="var(--ink-color)" />
      <rect x="14" y="28" width="4" height="2" fill="var(--ink-color)" />
    </svg>
  );
};
