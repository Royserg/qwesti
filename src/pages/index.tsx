import { Card, CardContent } from "~/components/ui/card";
import { A } from "../router";
import { Button } from "~/components/ui/button";
import { TodayDate } from "~/components/today-date";

const Home = () => {
  return (
    <main class="h-screen w-full">
      <TodayDate />

      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold underline">Hello world!</h1>

        <Card>
          <CardContent>This is my card</CardContent>
        </Card>

        <Button as={A} href="/about">
          Go to About
        </Button>
      </div>
    </main>
  );
};

export default Home;
