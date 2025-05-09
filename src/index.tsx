/* @refresh reload */
import { createRouter, RouterProvider } from '@tanstack/solid-router';
import { render } from "solid-js/web";
import { LAST_VISITED_PAGE_KEY } from "./lib/localstorage";
import { routeTree } from './routeTree.gen';

import "./index.css";

const wrapper = document.getElementById("app");

if (!wrapper) {
  throw new Error("Wrapper div not found");
}


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

  const lastPage = localStorage.getItem(LAST_VISITED_PAGE_KEY);
  if (lastPage) {
    router.navigate({ to: lastPage })
  }

  render(() => <RouterProvider router={router} />, wrapper)
}
