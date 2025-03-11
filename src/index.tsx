/* @refresh reload */
import { Route, RoutePreloadFuncArgs, Router } from "@solidjs/router";
import { onMount } from "solid-js";
import { render } from "solid-js/web";

import { QuestDetails } from "./pages/quest-details";
import { getQuests, Quests } from "./pages/quests.tsx";

import "./index.css";

const wrapper = document.getElementById("app");

if (!wrapper) {
  throw new Error("Wrapper div not found");
}

// ===========
import { RouterProvider, createRouter } from '@tanstack/solid-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultViewTransition: true,
})

// Register the router instance for type safety
declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
if (!wrapper.innerHTML) {
  render(() => <RouterProvider router={router} />, wrapper)
}



// ===========
//
// // -- Main Router
// const Root = () => {
//   // Reloads the page when pressing "ctrl+r"
//   onMount(() => {
//     const body = document.querySelector("body");
//     body?.addEventListener("keydown", (e) => {
//       if (e.code === "KeyR") {
//         if (e.metaKey) {
//           window.location.reload();
//         }
//       }
//     });
//   });
//
//   return (
//     <Router>
//       <Route path='/' component={Quests} preload={preloadQuests} />
//       <Route path='/quests/:id' component={QuestDetails} />
//     </Router>
//   )
// };
//
// render(Root, wrapper);

