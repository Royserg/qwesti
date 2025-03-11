import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/quests/$questId')({
  component: RouteComponent,
})

function RouteComponent() {

  const params = Route.useParams();

  return <div>
    <h2>questId: {params().questId}</h2>
  </div>
}
