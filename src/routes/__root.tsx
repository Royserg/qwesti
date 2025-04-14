import { createRootRoute, Outlet } from '@tanstack/solid-router';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { Component, createSignal, onMount, Show } from 'solid-js';



export const Route = createRootRoute({
  component: Layout
});

function Layout() {
  // On app open check for updates
  const [updateChecked, setUpdateChecked] = createSignal(false);

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
    <>
      <Show when={!updateChecked()}>
        <UpdateScreen onUpToDate={() => setUpdateChecked(true)} />
      </Show>
      <Show when={updateChecked()}>
        <Outlet />
      </Show>
    </>
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
