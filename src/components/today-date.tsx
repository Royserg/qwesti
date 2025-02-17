import { format } from "date-fns";
import { changeToNextDay, changeToPreviousDay, FE_DATE_FORMAT, selectedDate } from "~/stores/date";

export const TodayDate = () => {
  return (
    <div class="flex mx-auto gap-2">
      <button
        onClick={() => changeToPreviousDay()}
        class="border cursor-pointer"
      >
        Prev
      </button>

      <h3 class="text-center text-4xl font-semibold">
        {format(selectedDate(), FE_DATE_FORMAT)}
      </h3>

      <button
        onClick={() => changeToNextDay()}
        class="border cursor-pointer"
      >
        Next
      </button>
    </div>
  );
};
