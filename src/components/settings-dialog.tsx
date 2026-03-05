import { format } from "date-fns";
import ChevronLeft from "icons/chevron-left";
import ChevronRight from "icons/chevron-right";
import X from "icons/x";
import { For, Show, createSignal, type Accessor, type Component, type Setter } from "solid-js";
import {
  HEADER_DATE_FORMAT_OPTIONS,
  HEADER_DATE_FORMAT_PRESETS,
  type HeaderDateFormatOption,
} from "~/lib/localstorage";

const PREVIEW_DATE = new Date(2026, 2, 6); // March 06, 2026

interface Props {
  dialogRef: Setter<HTMLDialogElement | undefined>;
  selectedFormat: Accessor<HeaderDateFormatOption>;
  onFormatChange: (format: HeaderDateFormatOption) => void;
  onClose: () => void;
}

export const SettingsDialog: Component<Props> = (props) => {
  const formatOptions = HEADER_DATE_FORMAT_OPTIONS;
  const [view, setView] = createSignal<"menu" | "date_format">("menu");

  const handleBackdropClick = (event: MouseEvent & { currentTarget: HTMLDialogElement; target: Element }) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setView("menu");
    props.onClose();
  };

  const title = () => view() === "menu" ? "Settings" : "Date format";

  return (
    <dialog
      ref={props.dialogRef}
      onClick={handleBackdropClick}
      class="fixed left-1/2 top-1/2 m-0 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xs border bg-background p-0 backdrop:bg-black/70 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="relative border-b px-5 py-4">
        <Show when={view() === "date_format"}>
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
          class="flex w-[200%] transition-transform duration-300 ease-out"
          style={{
            transform: view() === "menu" ? "translateX(0%)" : "translateX(-50%)",
          }}
        >
          <div class="w-1/2 px-5 py-4">
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
          </div>

          <div class="w-1/2 px-5 py-4">
            <div class="space-y-2">
              <For each={formatOptions}>
                {(option) => (
                  <label
                    class="flex cursor-pointer items-center justify-between rounded-xs border px-3 py-2 transition-colors hover:bg-gray-50"
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
        </div>
      </div>
    </dialog>
  );
};
