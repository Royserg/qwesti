import { createFileRoute } from '@tanstack/solid-router'
import { loadQuest } from '~/actions';
import { QuestCard } from '~/components/quest-card';

export const Route = createFileRoute('/quests/$questId')({
  component: RouteComponent,
  loader: ({ params }) => loadQuest({ id: params.questId })
})

function RouteComponent() {
  const params = Route.useParams();
  const quest = Route.useLoaderData()

  return <div>
    <QuestCard quest={quest()} />
  </div>
}
