/* @refresh reload */
import { Router } from "@solidjs/router";
import { lazy, onMount } from "solid-js";
import { render } from "solid-js/web";
import "./index.css";
import Home from "./pages/index";
import QuestDetails from "./pages/quest-details";

const wrapper = document.getElementById("app");

if (!wrapper) {
  throw new Error("Wrapper div not found");
}

const routes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/quests/:id",
    component: QuestDetails,
  },
  {
    path: "/about",
    component: lazy(() => import("./pages/about.tsx")),
  },
];

const Root = () => {


  // TODO: only in development for refreshing the app
  // remove when app v1 ready
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

