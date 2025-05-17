import { Link, useSearch } from "@tanstack/solid-router";
import { addDays, isEqual } from "date-fns";
import ChevronLeft from 'icons/chevron-left';
import ChevronRight from 'icons/chevron-right';
import ChevronsRight from 'icons/chevrons-right';
import { dateToString, getTodayDate } from "~/lib/date";
import { cn } from "~/lib/utils";

export const TodayDate = () => {
  const search = useSearch({ from: '/' })

  // Assume that the root "/" is the Today's date
  const isTodaySelected = () => {
    return !search().date;
  }

  return (
    <div class="flex relative mx-auto gap-2">
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

      <h3 class="text-center text-4xl font-medium w-[250px]">
        {search().date ?? getTodayDate()}
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
