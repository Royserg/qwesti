import { format } from "date-fns";
import ChevronLeft from 'icons/chevron-left';
import ChevronRight from 'icons/chevron-right';
import { createEffect } from "solid-js";
import { loadQuestsForDate } from "~/actions";
import { cn } from "~/lib/utils";
import { changeToNextDay, changeToPreviousDay, FE_DATE_FORMAT, isTodaySelected, selectedDate, selectedDateBEFormat } from "~/stores/date";
import { setStore } from "~/stores/quests";

export const TodayDate = () => {

  const handlePrevClick = () => {
    changeToPreviousDay();
  }
  const handleNextClick = () => {
    changeToNextDay();
  }

  createEffect(async () => {
    const dateString = selectedDateBEFormat();
    const quests = await loadQuestsForDate(dateString);
    setStore(dateString, quests.length > 0 ? quests : []);
  })


  return (
    <div class="flex mx-auto gap-2">
      <button
        onClick={handlePrevClick}
        class="cursor-pointer"
      >
        <ChevronLeft />
      </button>

      <h3 class="text-center text-4xl font-semibold w-[250px]">
        {format(selectedDate(), FE_DATE_FORMAT)}
      </h3>

      <button
        onClick={handleNextClick}
        class={cn("cursor-pointer", {
          "invisible": isTodaySelected()
        })}
      >
        <ChevronRight />
      </button>
    </div>
  );
};
