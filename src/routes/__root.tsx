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
const UPDATE_CHECK_TIMEOUT_MS = 15_000;
const UPDATE_INSTALL_TIMEOUT_MS = 5 * 60_000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
  let timeoutId: number | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

export const Route = createRootRoute({
  component: Layout,
  beforeLoad(ctx) {
    // Save last navigated path in local storage and retrieve when opening the app
    localStorage.setItem(LAST_VISITED_PAGE_KEY, ctx.location.href)
  },
});

function Layout() {
  // TODO: at some point should check if we are online to check for update
  // should open app without checking in offline mode
  const [updateChecked, setUpdateChecked] = createSignal(navigator.onLine ? false : true);
  const handleReloadShortcut = (e: KeyboardEvent) => {
    if (e.code === "KeyR" && e.metaKey) {
      window.location.reload();
    }
  };

  onMount(() => {
    const body = document.querySelector("body");
    body?.addEventListener("keydown", handleReloadShortcut);
  });

  onCleanup(() => {
    const body = document.querySelector("body");
    body?.removeEventListener("keydown", handleReloadShortcut);
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
  const [downloaded, setDownloaded] = createSignal(0);

  onMount(async () => {
    try {
      if (!navigator.onLine) {
        console.info('Offline detected, skipping update check.');
        props.onUpToDate();
        return;
      }

      const update = await withTimeout(check(), UPDATE_CHECK_TIMEOUT_MS, 'Update check');

      if (!update) {
        props.onUpToDate();
        return;
      }

      console.log(
        `found update ${update.version} from ${update.date} with notes ${update.body}`
      );

      let downloadedBytes = 0;
      let contentLength = 0;

      await withTimeout(
        update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength ?? 0;
              setLength(contentLength);
              console.log(`started downloading ${contentLength} bytes`);
              break;
            case 'Progress':
              downloadedBytes += event.data.chunkLength;
              setDownloaded(downloadedBytes);
              console.log(`downloaded ${downloadedBytes} from ${contentLength}`);
              break;
            case 'Finished':
              console.log('download finished');
              break;
          }
        }),
        UPDATE_INSTALL_TIMEOUT_MS,
        'Update download and install',
      );

      console.log('update installed');
      await relaunch();
    } catch (error) {
      console.error('Updater failed during startup, opening app without blocking.', error);
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
