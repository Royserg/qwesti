/* @refresh reload */
import { Route, Router } from "@solidjs/router";
import { onMount } from "solid-js";
import { render } from "solid-js/web";
import QuestDetails from "./pages/quest-details";
import Quests from "./pages/quests.tsx";
import { RootRoute } from "./pages/root.tsx";

import "./index.css";

const wrapper = document.getElementById("app");

if (!wrapper) {
  throw new Error("Wrapper div not found");
}

const Root = () => {
  // Reloads the page when pressing "ctrl+r"
  onMount(() => {
    const body = document.querySelector("body");
    body?.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") {
        if (e.metaKey) {
          window.location.reload();
        }
      }
    });
  });

  return (
    <Router root={RootRoute}>
      <Route path='/' component={Quests} />
      <Route path='/quests/:id' component={QuestDetails} />
    </Router>
  )
};

render(Root, wrapper);

