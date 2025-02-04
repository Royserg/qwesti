import { AddQuestForm } from "~/components/add-quest-form";
import { QuestsList } from "~/components/quests-list";
import { TodayDate } from "~/components/today-date";

export const Home = () => {
	return (
		<main>
			<TodayDate />

			<div class="flex flex-col gap-2">
				<section class="my-2 px-4">
					<AddQuestForm />
				</section>

				<section class="flex flex-col gap-1 px-4">
					<QuestsList />
				</section>
			</div>
		</main>
	);
};
export default Home;
