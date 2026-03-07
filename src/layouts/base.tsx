import { Component, ParentProps } from "solid-js";
import { cn } from "~/lib/utils";

interface Props extends ParentProps {
  class?: string;
}

export const BaseLayout: Component<Props> = (props) => {
  return (
    <main class={cn("app-frame relative mx-auto flex h-screen min-h-0 w-full overflow-hidden", props.class)}>
      {props.children}
    </main>
  )
}
