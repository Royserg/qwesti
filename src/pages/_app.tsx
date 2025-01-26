import { ParentProps } from "solid-js";
import Swup from "swup";

export default function App(props: ParentProps) {
  new Swup({
    animationScope: "containers",
    // native: true,
    containers: ["#content"],
  });

  return (
    <section class="flex h-screen w-screen flex-col gap-2 overflow-hidden p-2">
      <header>
        <nav>The Nav (persist)</nav>
      </header>

      <main id="content" class="transition-fade">
        {props.children}
      </main>
    </section>
  );
}
