/* @refresh reload */
import { render } from "solid-js/web";


import "./index.css";

const wrapper = document.getElementById("app");

if (!wrapper) {
  throw new Error("Wrapper div not found");
}

// ===========
import { createRouter, RouterProvider } from '@tanstack/solid-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

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

