/* @refresh reload */
import { Router } from "@solidjs/router";
import { lazy, onMount } from "solid-js";
import { render } from "solid-js/web";
import "./index.css";
import QuestDetails from "./pages/quest-details";
import { RootRoute } from "./pages/root.tsx";

const wrapper = document.getElementById("app");

if (!wrapper) {
  throw new Error("Wrapper div not found");
}

const routes = [
  {
    path: "/",
    component: RootRoute,
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/quests.tsx")),
      },
      {
        path: "/quests/:id",
        component: QuestDetails,
      },
      {
        path: "/about",
        component: lazy(() => import("./pages/about.tsx")),
      },
    ]
  },
];

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

  return <Router>{routes}</Router>
};

render(Root, wrapper);

