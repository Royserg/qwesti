import { revalidate } from "@solidjs/router";
import { format } from "date-fns";
import { getQuests } from "~/actions";
import { changeToNextDay, changeToPreviousDay, FE_DATE_FORMAT, selectedDate } from "~/stores/date";

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


  return (
    <div class="flex mx-auto gap-2">
      <button
        onClick={handlePrevClick}
        class="border cursor-pointer"
      >
        Prev
      </button>

      <h3 class="text-center text-4xl font-semibold">
        {format(selectedDate(), FE_DATE_FORMAT)}
      </h3>

      <button
        onClick={handleNextClick}
        class="border cursor-pointer"
      >
        Next
      </button>
    </div>
  );
};
