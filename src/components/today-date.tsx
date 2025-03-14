import { Link, useSearch } from "@tanstack/solid-router";
import { addDays, format } from "date-fns";
import ChevronLeft from 'icons/chevron-left';
import ChevronRight from 'icons/chevron-right';
import { cn } from "~/lib/utils";
import { BE_DATE_FROMAT } from "~/stores/date";

export const TodayDate = () => {
  const search = useSearch({ from: '/' })

  const dateToString = (date: Date) => {
    return format(date, BE_DATE_FROMAT);
  }

  const isTodaySelected = () => {
    const today = dateToString(new Date());
    return search().date === today;
  }

  return (
    <div class="flex mx-auto gap-2">
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

      <h3 class="text-center text-4xl font-semibold w-[250px]">
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
    </div>
  );
};
