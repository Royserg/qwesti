import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/solid-query';
import { createRootRoute, Outlet } from '@tanstack/solid-router';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { LAST_VISITED_PAGE_KEY } from '~/lib/localstorage';

export const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: Layout,
  beforeLoad(ctx) {
    // Save last navigated path in local storage and retrieve when opening the app
    localStorage.setItem(LAST_VISITED_PAGE_KEY, ctx.location.href)
  },
});

function Layout() {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine);

  // TODO: at some point should check if we are online to check for update
  // should open app without checking in offline mode
  const [updateChecked, setUpdateChecked] = createSignal(navigator.onLine ? false : true);

  const updateNetworkStatus = () => {
    setIsOnline(navigator.onLine);
  };

  onMount(() => {
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    const body = document.querySelector("body");
    body?.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") {
        if (e.metaKey) {
          window.location.reload();
        }
      }
    });
  });

  onCleanup(() => {
    window.removeEventListener('online', updateNetworkStatus);
    window.removeEventListener('offline', updateNetworkStatus);
  })

  return (
    <QueryClientProvider client={queryClient}>
      <Show when={!updateChecked()}>
        <UpdateScreen onUpToDate={() => setUpdateChecked(true)} />
      </Show>

      <Show when={updateChecked()}>
        <Outlet />
      </Show>
    </QueryClientProvider>
  )
}


interface UpdateScreenProps {
  onUpToDate: () => void;
}
const UpdateScreen: Component<UpdateScreenProps> = (props) => {

  const [length, setLength] = createSignal(0);
  const [downloaded, setDownloaded] = createSignal(0); 0

  onMount(async () => {
    const update = await check();

    if (update) {
      console.log(
        `found update ${update.version} from ${update.date} with notes ${update.body}`
      );
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setLength(event.data.contentLength ?? 0)
            // contentLength = event.data.contentLength ?? 0;
            console.log(`started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            // downloaded += event.data.chunkLength;
            setDownloaded((d) => d + event.data.chunkLength)
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            break;
          case 'Finished':
            console.log('download finished');
            break;
        }
      });

      console.log('update installed');
      await relaunch();
    } else {
      props.onUpToDate()
    }
  })

  return (
    <div class="w-full h-full grid place-items-center">

      <Show when={length() === 0}>
        <h2 class='text-2xl'>Checking for updates...</h2>
      </Show>

      <Show when={length() > 0}>
        <h2 class='text-2xl'>Downloaded {downloaded()} from {length()}</h2>
      </Show>
    </div>
  )
}
