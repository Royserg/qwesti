import { Square } from "lucide-solid";
import { createResource, For, Show } from "solid-js";
import { commands } from "~/bindings";
import { AddQuestForm } from "~/components/add-quest-form";
import { TodayDate } from "~/components/today-date";
import { Card, CardContent } from "~/components/ui/card";

const Home = () => {
	const [data, { refetch }] = createResource(() => commands.getQuests());

	return (
		<main class="h-screen w-full">
			<TodayDate />

			<div class="flex flex-col gap-2">
				<section class="my-2 px-4">
					<AddQuestForm onQuestAdded={refetch} />
				</section>

				<section class="flex flex-col gap-1 px-4">
					<Show when={data.loading}>
						<div>...Loading</div>
					</Show>

					<Show when={!data.loading}>
						<Show when={data()}>
							{(data) => {
								const dataRes = data();
								if (dataRes.status === "ok") {
									return (
										<For each={dataRes.data}>
											{(item) => {
												return (
													<Card class="h-full">
														<CardContent class="flex gap-2 justify-start align-middle p-2">
															<div class="pr-4">
																{item.completed === 1 ? "done" : <Square />}
															</div>
															<h5>{item.title}</h5>
														</CardContent>
													</Card>
												);
											}}
										</For>
									);
								}
							}}
						</Show>
					</Show>
				</section>
			</div>
		</main>
	);
};

export default Home;

// <div>
// <div class="py-4" />

// <TodayDate />

// <div class="py-4" />

// <section class="max-w-[700px] mx-auto">
//   <header class="bg-white shadow-lg">
//     <AddQuestForm />
//   </header>

//   <div class="py-2" />

//   {/* Filters */}
//   <section ref={parent} class="main ">
//     <Show when={quests().length || createQuestSubmission.length}>
//       <div class="flex justify-end w-full">
//         <Filters location={location} />
//       </div>
//     </Show>

//     {/* Quest List */}
//     <ul ref={list} class="todo-list ">
//       <For each={filterList(quests())}>
//         {(quest) => <QuestItem quest={quest} />}
//       </For>
//     </ul>
//   </section>
// </section>

// <a href="/details" class="p-3 border rounded-sm">
//   Details page
// </a>
// </div>
