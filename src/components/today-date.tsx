import { revalidate } from "@solidjs/router";
import { format } from "date-fns";
import ChevronLeft from 'icons/chevron-left';
import ChevronRight from 'icons/chevron-right';
import { createEffect } from "solid-js";
import { getQuests, loadQuestsForDate } from "~/actions";
import { cn } from "~/lib/utils";
import { BE_DATE_FROMAT, changeToNextDay, changeToPreviousDay, FE_DATE_FORMAT, isTodaySelected, selectedDate } from "~/stores/date";
import { setStore } from "~/stores/quests";

export const TodayDate = () => {

  const revalidateQuests = () => {
    revalidate(getQuests.key);
  }

  const handlePrevClick = () => {
    changeToPreviousDay();
    revalidateQuests()
  }
  const handleNextClick = () => {
    changeToNextDay();
    revalidateQuests()
  }

  createEffect(async () => {
    const dateString = format(selectedDate(), BE_DATE_FROMAT);
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
