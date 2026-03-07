import { Link, useNavigate, useSearch } from "@tanstack/solid-router";
import { addDays, format, isEqual, isValid, parse } from "date-fns";
import ChevronLeft from "icons/chevron-left";
import ChevronRight from "icons/chevron-right";
import ChevronsRight from "icons/chevrons-right";
import List from "icons/list";
import ListTree from "icons/list-tree";
import Settings from "icons/settings";
import { createSignal } from "solid-js";
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
      <button
        type="button"
        onClick={toggleView}
        class="pixel-icon-button fixed left-4 top-4 z-20 sm:left-6 sm:top-6"
        title={isTreeView() ? "Switch to list view" : "Switch to tree view"}
        aria-label={isTreeView() ? "Switch to list view" : "Switch to tree view"}
      >
        {isTreeView() ? <List class="size-5" /> : <ListTree class="size-5" />}
      </button>

      <button
        type="button"
        onClick={openSettings}
        class="pixel-icon-button fixed right-4 top-4 z-20 sm:right-6 sm:top-6"
        title="Settings"
        aria-label="Open settings"
      >
        <Settings class="size-5" />
      </button>

      <SettingsDialog
        dialogRef={setSettingsDialogRef}
        selectedFormat={dateFormatOption}
        onFormatChange={handleDateFormatChange}
        onClose={closeSettings}
      />

      <div class="mx-auto flex w-full max-w-[420px] flex-col items-center gap-3 px-4">
        <div class="pixel-panel flex w-full items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <Link
            to="/"
            search={{
              filter: "all",
              view: currentView(),
              date: dateToString(addDays(new Date(search().date ?? getTodayDate()), -1)),
            }}
            class="pixel-link-button"
            aria-label="Go to previous day"
          >
            <ChevronLeft />
          </Link>

          <h1
            class="type-pixel min-w-0 flex-1 px-2 text-center text-[1.45rem] leading-none sm:text-[1.8rem]"
            title="Date format can be changed in localStorage key: headerDateFormat"
          >
            {renderDate()}
          </h1>

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
            class={cn("pixel-link-button", {
              invisible: isTodaySelected(),
            })}
            aria-label="Go to next day"
          >
            <ChevronRight />
          </Link>
        </div>

        <Link
          to="/"
          search={{ filter: "all", view: currentView() }}
          class={cn("pixel-inline-button", {
            invisible: isTodaySelected(),
          })}
        >
          <ChevronsRight />
          today
        </Link>
      </div>
    </>
  );
};
