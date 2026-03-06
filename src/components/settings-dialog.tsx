import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { format } from "date-fns";
import ChevronLeft from "icons/chevron-left";
import ChevronRight from "icons/chevron-right";
import X from "icons/x";
import { For, Show, createSignal, onMount, type Accessor, type Component, type Setter } from "solid-js";
import {
  HEADER_DATE_FORMAT_OPTIONS,
  HEADER_DATE_FORMAT_PRESETS,
  type HeaderDateFormatOption,
} from "~/lib/localstorage";
import { cn } from "~/lib/utils";

const PREVIEW_DATE = new Date(2026, 2, 6); // March 06, 2026
const REPOSITORY_URL = "https://github.com/Royserg/qwesti";

type SettingsView = "menu" | "date_format" | "about";
const VIEW_INDEX: Record<SettingsView, number> = {
  menu: 0,
  date_format: 1,
  about: 2,
};
const VIEW_TITLE: Record<SettingsView, string> = {
  menu: "Settings",
  date_format: "Date format",
  about: "About",
};

interface Props {
  dialogRef: Setter<HTMLDialogElement | undefined>;
  selectedFormat: Accessor<HeaderDateFormatOption>;
  onFormatChange: (format: HeaderDateFormatOption) => void;
  onClose: () => void;
}

export const SettingsDialog: Component<Props> = (props) => {
  const formatOptions = HEADER_DATE_FORMAT_OPTIONS;
  const [view, setView] = createSignal<SettingsView>("menu");
  const [appVersion, setAppVersion] = createSignal("Loading...");
  const [isCheckingUpdates, setIsCheckingUpdates] = createSignal(false);
  const [updateStatus, setUpdateStatus] = createSignal("");

  const handleBackdropClick = (event: MouseEvent & { currentTarget: HTMLDialogElement; target: Element }) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setView("menu");
    setUpdateStatus("");
    props.onClose();
  };

  const title = () => VIEW_TITLE[view()];

  const openRepository = async () => {
    try {
      await openUrl(REPOSITORY_URL);
    } catch (error) {
      console.error("Failed to open repository using opener plugin. Falling back to browser open.", error);
      window.open(REPOSITORY_URL, "_blank", "noopener,noreferrer");
    }
  };

  const checkForUpdates = async () => {
    if (isCheckingUpdates()) {
      return;
    }

    if (!navigator.onLine) {
      setUpdateStatus("You are offline. Connect to the internet and try again.");
      return;
    }

    setIsCheckingUpdates(true);
    setUpdateStatus("Checking for updates...");

    try {
      const update = await check();

      if (!update) {
        setUpdateStatus("You are up to date.");
        return;
      }

      let downloadedBytes = 0;
      let contentLength = 0;
      setUpdateStatus(`Update ${update.version} found. Downloading...`);

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            setUpdateStatus(`Downloading update... 0 / ${contentLength} bytes`);
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            setUpdateStatus(`Downloading update... ${downloadedBytes} / ${contentLength} bytes`);
            break;
          case "Finished":
            setUpdateStatus("Update downloaded and installed.");
            break;
        }
      });

      const shouldRestart = window.confirm("Update installed successfully. Restart the app now?");
      if (shouldRestart) {
        await relaunch();
        return;
      }

      setUpdateStatus("Update installed. Restart the app later to use the new version.");
    } catch (error) {
      console.error("Failed to check/install update from About settings.", error);
      setUpdateStatus("Update check failed. Please try again.");
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  onMount(async () => {
    try {
      setAppVersion(await getVersion());
    } catch (error) {
      console.error("Failed to read app version from Tauri runtime.", error);
      setAppVersion("Unknown");
    }
  });

  return (
    <dialog
      ref={props.dialogRef}
      onClick={handleBackdropClick}
      class="fixed left-1/2 top-1/2 m-0 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xs border bg-background p-0 backdrop:bg-black/70 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="relative border-b px-5 py-4">
        <Show when={view() !== "menu"}>
          <button
            type="button"
            onClick={() => setView("menu")}
            class="absolute left-5 top-1/2 -translate-y-1/2 rounded-xs border p-1.5 hover:bg-gray-100"
            aria-label="Back to settings menu"
          >
            <ChevronLeft class="size-4" />
          </button>
        </Show>

        <h4 class="text-center text-xl font-semibold">{title()}</h4>

        <button
          type="button"
          onClick={handleClose}
          class="absolute right-5 top-1/2 -translate-y-1/2 rounded-xs border p-1.5 hover:bg-gray-100"
          aria-label="Close settings"
        >
          <X class="size-4" />
        </button>
      </div>

      <div class="overflow-hidden">
        <div
          class="flex w-[300%] transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${VIEW_INDEX[view()] * 33.333333}%)`,
          }}
        >
          <div class="w-1/3 px-5 py-4">
            <button
              type="button"
              onClick={() => setView("date_format")}
              class="flex w-full items-center justify-between rounded-xs border px-3 py-2 text-left transition-colors hover:bg-gray-50"
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium">Date format</span>
                <span class="text-sm text-gray-600">Configure header date display</span>
              </div>

              <ChevronRight class="size-4 text-gray-500" />
            </button>

            <button
              type="button"
              onClick={() => setView("about")}
              class="mt-2 flex w-full items-center justify-between rounded-xs border px-3 py-2 text-left transition-colors hover:bg-gray-50"
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium">About</span>
                <span class="text-sm text-gray-600">Version and repository</span>
              </div>

              <ChevronRight class="size-4 text-gray-500" />
            </button>
          </div>

          <div class="w-1/3 px-5 py-4">
            <div class="space-y-2">
              <For each={formatOptions}>
                {(option) => (
                  <label
                    class={cn(
                      "flex cursor-pointer items-center justify-between rounded-xs border px-3 py-2 transition-colors hover:bg-gray-50",
                      {
                        "border-amber-400 bg-amber-50": props.selectedFormat() === option,
                      },
                    )}
                  >
                    <div class="flex flex-col">
                      <span class="text-sm font-medium">{HEADER_DATE_FORMAT_PRESETS[option].label}</span>
                      <span class="text-sm text-gray-600">{format(PREVIEW_DATE, HEADER_DATE_FORMAT_PRESETS[option].token)}</span>
                    </div>

                    <input
                      type="radio"
                      name="header-date-format"
                      class="size-4 accent-amber-400"
                      checked={props.selectedFormat() === option}
                      onChange={() => props.onFormatChange(option)}
                    />
                  </label>
                )}
              </For>
            </div>
          </div>

          <div class="w-1/3 px-5 py-4">
            <div class="space-y-4">
              <div class="rounded-xs border px-3 py-2">
                <p class="text-xs uppercase tracking-wide text-gray-500">Version</p>
                <p class="text-base font-medium">{appVersion()}</p>
              </div>

              <div class="rounded-xs border px-3 py-2">
                <p class="text-xs uppercase tracking-wide text-gray-500">Repository</p>
                <button
                  type="button"
                  onClick={openRepository}
                  class="mt-1 text-left text-sm text-amber-700 underline underline-offset-2 hover:text-amber-800"
                >
                  github.com/Royserg/qwesti
                </button>
              </div>

              <div class="rounded-xs border px-3 py-2">
                <p class="text-xs uppercase tracking-wide text-gray-500">Updates</p>
                <button
                  type="button"
                  onClick={checkForUpdates}
                  disabled={isCheckingUpdates()}
                  class="mt-1 rounded-xs border border-amber-400 bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCheckingUpdates() ? "Checking..." : "Check for updates"}
                </button>

                <Show when={updateStatus().length > 0}>
                  <p class="mt-2 text-sm text-gray-700">{updateStatus()}</p>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
