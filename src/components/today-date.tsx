import { Link, useSearch } from "@tanstack/solid-router";
import { addDays, format, isEqual, isValid, parse } from "date-fns";
import ChevronLeft from 'icons/chevron-left';
import ChevronRight from 'icons/chevron-right';
import ChevronsRight from 'icons/chevrons-right';
import Settings from 'icons/settings';
import { createSignal } from "solid-js";
import { SettingsDialog } from "~/components/settings-dialog";
import { dateToString, getTodayDate } from "~/lib/date";
import {
  DEFAULT_HEADER_DATE_FORMAT,
  getHeaderDateFormat,
  HEADER_DATE_FORMAT_PRESETS,
  HeaderDateFormatOption,
  setHeaderDateFormat,
} from "~/lib/localstorage";
import { cn } from "~/lib/utils";
import { BE_DATE_FROMAT } from "~/stores/date";

export const TodayDate = () => {
  const search = useSearch({ from: '/' })
  const [settingsDialogRef, setSettingsDialogRef] = createSignal<HTMLDialogElement>();
  const [dateFormatOption, setDateFormatOption] = createSignal<HeaderDateFormatOption>(getHeaderDateFormat());

  // Assume that the root "/" is the Today's date
  const isTodaySelected = () => {
    return !search().date;
  }

  const renderDate = () => {
    const selectedDate = search().date ?? getTodayDate();
    const parsedDate = parse(selectedDate, BE_DATE_FROMAT, new Date());
    const formatToken = HEADER_DATE_FORMAT_PRESETS[dateFormatOption()]?.token
      ?? HEADER_DATE_FORMAT_PRESETS[DEFAULT_HEADER_DATE_FORMAT].token;

    if (!isValid(parsedDate)) {
      return selectedDate;
    }

    return format(parsedDate, formatToken);
  }

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

  return (
    <div class="flex relative mx-auto gap-2">
      <button
        type="button"
        onClick={openSettings}
        class="fixed right-4 top-4 z-20 rounded-xs border bg-card p-2 shadow-sm transition-colors hover:bg-gray-100"
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

      <Link
        to="/"
        search={{
          filter: 'all',
          date: dateToString(addDays(new Date(search().date ?? getTodayDate()), -1))
        }}
        class="flex items-center"
      >
        <ChevronLeft />
      </Link>

      <h3
        class="text-center text-4xl font-medium w-[250px] select-none"
        title="Date format can be changed in localStorage key: headerDateFormat"
      >
        {renderDate()}
      </h3>

      <Link
        to="/"
        search={{
          filter: 'all',
          // Don't set date in the url when navigating to Today's date (keep "go back" functionality to properly work after midnight)
          // so "/" is always the current date, because after midnigh 'go back' would go to previous day
          date: isEqual(
                    addDays(new Date(search().date ?? getTodayDate()), 1), new Date(getTodayDate())
                  )
                  ? undefined // When next day is today, don't set date in the url
                  : dateToString(addDays(new Date(search().date ?? getTodayDate()), 1))
        }}
        class={cn("flex items-center", {
          "invisible": isTodaySelected()
        })}
      >
        <ChevronRight />
      </Link>


      <Link
        to="/"
        search={{ filter: 'all' }}
        class={cn("absolute flex items-center text-gray-400 hover:text-gray-900 top-[8px] right-[-40px]", {
          "invisible": isTodaySelected()
        })}
      >
        <ChevronsRight />
      </Link>
    </div>
  );
};
