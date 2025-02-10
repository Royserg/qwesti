import { createAutoAnimate } from "@formkit/auto-animate/solid";
import { createAsyncStore } from "@solidjs/router";
import { ErrorBoundary, For, Suspense } from "solid-js";
import { getQuests } from "~/actions";
import { QuestCard } from "./quest-card";

export const QuestsList = () => {
	const data = createAsyncStore(() => getQuests());

	const [parent] = createAutoAnimate();

	return (
		<ul ref={parent} class="flex flex-col gap-1">
			<Suspense fallback={<div>Loading...</div>}>
				<ErrorBoundary fallback={<div>Error</div>}>
					<For each={data()}>{(item) => <QuestCard quest={item} />}</For>
				</ErrorBoundary>
			</Suspense>
		</ul>
	);
};
