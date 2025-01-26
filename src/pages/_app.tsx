import { ParentProps } from "solid-js";
import Swup from "swup";

export default function App(props: ParentProps) {
  new Swup({
    animationScope: "containers",
    // native: true,
    containers: ["#content"],
  });

  return (
    <section>
      <header>
        <nav>The Nav (persist)</nav>
      </header>

      <main id="content" class="transition-fade">
        {props.children}
      </main>
    </section>
  );
}
