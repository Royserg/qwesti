import { createRootRoute, Outlet } from '@tanstack/solid-router';
import { onMount } from 'solid-js';

export const Route = createRootRoute({
  component: Layout
});

function Layout() {
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

  return <Outlet />
}
