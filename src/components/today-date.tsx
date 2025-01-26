import { format } from "date-fns";

export const TodayDate = () => {
  const today = format(new Date(), "dd / MM / yyyy");

  return <h3 class="text-center text-4xl font-semibold">{today}</h3>;
};
