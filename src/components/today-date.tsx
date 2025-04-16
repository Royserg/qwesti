import { Link, useSearch } from "@tanstack/solid-router";
import { addDays } from "date-fns";
import ChevronLeft from 'icons/chevron-left';
import ChevronRight from 'icons/chevron-right';
import ChevronsRight from 'icons/chevrons-right';
import { dateToString, getTodayDate } from "~/lib/date";
import { cn } from "~/lib/utils";

export const TodayDate = () => {
  const search = useSearch({ from: '/' })

  const isTodaySelected = () => {
    return search().date === getTodayDate();
  }

  return (
    <div class="flex relative mx-auto gap-2">
      <Link
        to="/"
        search={{
          filter: 'all',
          date: dateToString(addDays(new Date(search().date), -1))
        }}
        class="flex items-center"
      >
        <ChevronLeft />
      </Link>

      <h3 class="text-center text-4xl font-medium w-[250px]">
        {search().date}
      </h3>

      <Link
        to="/"
        search={{
          filter: 'all',
          date: dateToString(addDays(new Date(search().date), 1))
        }}
        class={cn("flex items-center", {
          "invisible": isTodaySelected()
        })}
      >
        <ChevronRight />
      </Link>


      <Link
        to="/"
        search={{
          filter: 'all',
          date: dateToString(new Date())
        }}
        class={cn("absolute flex items-center text-gray-400 hover:text-gray-900 top-[8px] right-[-40px]", {
          "invisible": isTodaySelected()
        })}
      >
        <ChevronsRight />
      </Link>
    </div>
  );
};
