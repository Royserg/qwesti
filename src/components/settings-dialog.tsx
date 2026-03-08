import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { format } from "date-fns";
import ChevronLeft from "icons/chevron-left";
import ChevronRight from "icons/chevron-right";
import X from "icons/x";
import {
  For,
  Show,
  createSignal,
  onMount,
  type Accessor,
  type Component,
  type Setter,
} from "solid-js";
import logoUrl from "../../src-tauri/icons/icon.png";
import {
  HEADER_DATE_FORMAT_OPTIONS,
  HEADER_DATE_FORMAT_PRESETS,
  type HeaderDateFormatOption,
} from "~/lib/localstorage";
import { cn } from "~/lib/utils";

const PREVIEW_DATE = new Date(2026, 2, 6);
const REPOSITORY_URL = "https://github.com/Royserg/qwesti";

type SettingsView = "menu" | "date_format" | "about";
const VIEW_INDEX: Record<SettingsView, number> = {
  menu: 0,
  date_format: 1,
  about: 2,
};
const VIEW_TITLE: Record<SettingsView, string> = {
  menu: "settings",
  date_format: "date format",
  about: "about",
};

interface Props {
  dialogRef: Setter<HTMLDialogElement | undefined>;
  selectedFormat: Accessor<HeaderDateFormatOption>;
  onFormatChange: (format: HeaderDateFormatOption) => void;
  onClose: () => void;
}

export const SettingsDialog: Component<Props> = (props) => {
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
      setUpdateStatus("offline. reconnect and try again.");
      return;
    }

    setIsCheckingUpdates(true);
    setUpdateStatus("checking for updates...");

    try {
      const update = await check();

      if (!update) {
        setUpdateStatus("you are up to date.");
        return;
      }

      let downloadedBytes = 0;
      let contentLength = 0;
      setUpdateStatus(`update ${update.version} found. downloading...`);

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            setUpdateStatus(`downloading... 0 / ${contentLength} bytes`);
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            setUpdateStatus(`downloading... ${downloadedBytes} / ${contentLength} bytes`);
            break;
          case "Finished":
            setUpdateStatus("update installed.");
            break;
        }
      });

      const shouldRestart = window.confirm("Update installed successfully. Restart the app now?");
      if (shouldRestart) {
        await relaunch();
        return;
      }

      setUpdateStatus("restart later to use the new version.");
    } catch (error) {
      console.error("Failed to check/install update from About settings.", error);
      setUpdateStatus("update check failed. try again.");
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
    <dialog ref={props.dialogRef} onClick={handleBackdropClick} class="pixel-dialog">
      <div class="pixel-dialog__panel relative mx-auto overflow-hidden">
        <div class="flex items-center justify-between border-b-2 border-[var(--line-color)] px-5 py-4">
          <Show when={view() !== "menu"}>
            <button
              type="button"
              onClick={() => setView("menu")}
              class="pixel-icon-button size-10"
              aria-label="Back to settings menu"
            >
              <ChevronLeft />
            </button>
          </Show>

          <Show when={view() === "menu"}>
            <div class="w-10" />
          </Show>

          <h4 class="type-pixel text-lg">{title()}</h4>

          <button
            type="button"
            onClick={handleClose}
            class="pixel-icon-button size-10"
            aria-label="Close settings"
          >
            <X />
          </button>
        </div>

        <div
          class="flex w-[300%] transition-transform duration-200"
          style={{
            transform: `translateX(-${VIEW_INDEX[view()] * 33.333333}%)`,
          }}
        >
          <div class="w-1/3 px-5 py-5">
            <div class="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setView("date_format")}
                class="pixel-shell-card flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <div class="flex flex-col gap-1">
                  <span class="type-pixel text-sm">date format</span>
                  <span class="text-sm text-[var(--muted-color)]">configure the header date display</span>
                </div>

                <ChevronRight class="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setView("about")}
                class="pixel-shell-card flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <div class="flex flex-col gap-1">
                  <span class="type-pixel text-sm">about</span>
                  <span class="text-sm text-[var(--muted-color)]">version, repository, and updates</span>
                </div>

                <ChevronRight class="size-4" />
              </button>
            </div>
          </div>

          <div class="w-1/3 px-5 py-5">
            <div class="flex flex-col gap-3">
              <For each={HEADER_DATE_FORMAT_OPTIONS}>
                {(option) => (
                  <label
                    class={cn("pixel-shell-card flex cursor-pointer items-center justify-between gap-4 px-4 py-3", {
                      "bg-[var(--accent-soft-color)]": props.selectedFormat() === option,
                    })}
                  >
                    <div class="flex flex-col gap-1">
                      <span class="type-pixel text-sm">{HEADER_DATE_FORMAT_PRESETS[option].label}</span>
                      <span class="text-sm text-[var(--muted-color)]">
                        {format(PREVIEW_DATE, HEADER_DATE_FORMAT_PRESETS[option].token)}
                      </span>
                    </div>

                    <input
                      type="radio"
                      name="header-date-format"
                      class="pixel-radio"
                      checked={props.selectedFormat() === option}
                      onChange={() => props.onFormatChange(option)}
                    />
                  </label>
                )}
              </For>
            </div>
          </div>

          <div class="w-1/3 px-5 py-5">
            <div class="flex flex-col gap-3">
              <div class="pixel-shell-card flex items-center gap-4 px-4 py-4">
                <img src={logoUrl} alt="Qwesti logo" class="h-16 w-16 shrink-0 object-contain" />
                <div class="flex flex-col gap-1">
                  <p class="type-pixel text-sm">qwesti</p>
                  <p class="text-sm text-[var(--muted-color)]">pixel task tracker for infinitely nested tasks.</p>
                </div>
              </div>

              <div class="pixel-shell-card px-4 py-3">
                <p class="type-pixel text-sm">version</p>
                <p class="mt-2 text-sm">{appVersion()}</p>
              </div>

              <div class="pixel-shell-card px-4 py-3">
                <p class="type-pixel text-sm">repository</p>
                <button
                  type="button"
                  onClick={openRepository}
                  class="mt-2 text-left text-sm underline underline-offset-2"
                >
                  github.com/Royserg/qwesti
                </button>
              </div>

              <div class="pixel-shell-card px-4 py-3">
                <p class="type-pixel text-sm">updates</p>
                <button
                  type="button"
                  onClick={checkForUpdates}
                  disabled={isCheckingUpdates()}
                  class="pixel-inline-button mt-3"
                >
                  {isCheckingUpdates() ? "checking..." : "check for updates"}
                </button>

                <Show when={updateStatus().length > 0}>
                  <p class="mt-3 text-sm text-[var(--muted-color)]">{updateStatus()}</p>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
