import { Link, useNavigate, useSearch } from "@tanstack/solid-router";
import { addDays, format, isEqual, isValid, parse } from "date-fns";
import ChevronLeft from "icons/chevron-left";
import ChevronRight from "icons/chevron-right";
import ChevronsRight from "icons/chevrons-right";
import List from "icons/list";
import ListTree from "icons/list-tree";
import Settings from "icons/settings";
import { Show, createSignal } from "solid-js";
import { SettingsDialog } from "~/components/settings-dialog";
import { dateToString, getTodayDate } from "~/lib/date";
import {
  DEFAULT_HEADER_DATE_FORMAT,
  getHeaderDateFormat,
  HEADER_DATE_FORMAT_PRESETS,
  type HeaderDateFormatOption,
  setHeaderDateFormat,
} from "~/lib/localstorage";
import { cn } from "~/lib/utils";
import { BE_DATE_FROMAT } from "~/stores/date";

export const TodayDate = () => {
  const navigate = useNavigate({ from: "/" });
  const search = useSearch({ from: "/" });
  const [settingsDialogRef, setSettingsDialogRef] = createSignal<HTMLDialogElement>();
  const [dateFormatOption, setDateFormatOption] =
    createSignal<HeaderDateFormatOption>(getHeaderDateFormat());

  const isTodaySelected = () => !search().date;

  const renderDate = () => {
    const selectedDate = search().date ?? getTodayDate();
    const parsedDate = parse(selectedDate, BE_DATE_FROMAT, new Date());
    const formatToken =
      HEADER_DATE_FORMAT_PRESETS[dateFormatOption()]?.token
      ?? HEADER_DATE_FORMAT_PRESETS[DEFAULT_HEADER_DATE_FORMAT].token;

    if (!isValid(parsedDate)) {
      return selectedDate;
    }

    return format(parsedDate, formatToken);
  };

  const openSettings = () => {
    settingsDialogRef()?.showModal();
  };

  const closeSettings = () => {
    settingsDialogRef()?.close();
  };

  const handleDateFormatChange = (formatValue: HeaderDateFormatOption) => {
    setDateFormatOption(formatValue);
    setHeaderDateFormat(formatValue);
  };

  const currentView = () => search().view ?? "list";
  const isTreeView = () => currentView() === "tree";
  const toggleView = () => {
    navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        view: prev.view === "tree" ? "list" : "tree",
      }),
      replace: true,
    });
  };

  return (
    <>
      <SettingsDialog
        dialogRef={setSettingsDialogRef}
        selectedFormat={dateFormatOption}
        onFormatChange={handleDateFormatChange}
        onClose={closeSettings}
      />

      <div class="mx-auto flex w-full max-w-[640px] items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleView}
          class="pixel-icon-button h-11 w-11 shrink-0 sm:h-12 sm:w-12"
          title={isTreeView() ? "Switch to list view" : "Switch to tree view"}
          aria-label={isTreeView() ? "Switch to list view" : "Switch to tree view"}
        >
          {isTreeView() ? <List class="size-[18px]" /> : <ListTree class="size-[18px]" />}
        </button>

        <div class="pixel-panel flex min-w-0 flex-1 items-center gap-2 px-2 py-2 sm:px-3 sm:py-2.5">
          <Link
            to="/"
            search={{
              filter: "all",
              view: currentView(),
              date: dateToString(addDays(new Date(search().date ?? getTodayDate()), -1)),
            }}
            class="pixel-link-button h-9 w-9 min-h-0 min-w-0 shrink-0 sm:h-10 sm:w-10"
            aria-label="Go to previous day"
          >
            <ChevronLeft class="size-4" />
          </Link>

          <div class="flex min-w-0 flex-1 items-center justify-center gap-2">
            <h1
              class="type-pixel truncate px-1 text-center text-[1.05rem] leading-none sm:text-[1.2rem]"
              title="Date format can be changed in localStorage key: headerDateFormat"
            >
              {renderDate()}
            </h1>

            <Show when={!isTodaySelected()}>
              <Link
                to="/"
                search={{ filter: "all", view: currentView() }}
                class="pixel-inline-button min-h-[32px] shrink-0 px-2.5 text-[0.62rem]"
              >
                <ChevronsRight class="size-3.5" />
                <span class="hidden sm:inline">today</span>
              </Link>
            </Show>
          </div>

          <Link
            to="/"
            search={{
              filter: "all",
              view: currentView(),
              date: isEqual(
                addDays(new Date(search().date ?? getTodayDate()), 1),
                new Date(getTodayDate()),
              )
                ? undefined
                : dateToString(addDays(new Date(search().date ?? getTodayDate()), 1)),
            }}
            class={cn("pixel-link-button h-9 w-9 min-h-0 min-w-0 shrink-0 sm:h-10 sm:w-10", {
              invisible: isTodaySelected(),
            })}
            aria-label="Go to next day"
          >
            <ChevronRight class="size-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={openSettings}
          class="pixel-icon-button h-11 w-11 shrink-0 sm:h-12 sm:w-12"
          title="Settings"
          aria-label="Open settings"
        >
          <Settings class="size-[18px]" />
        </button>
      </div>
    </>
  );
};
