import { Component, ParentProps } from "solid-js"
import { cn } from "~/lib/utils";

interface Props extends ParentProps {
  class?: string;
}

export const BaseLayout: Component<Props> = (props) => {
  return (
    <main class={cn('w-full h-full', props.class)}>
      {props.children}
    </main>
  )
}

