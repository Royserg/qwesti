import { createFileRoute, Link } from '@tanstack/solid-router'



// async function preloadQuests(_args: RoutePreloadFuncArgs) {
//   void await getQuests()
// }


export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div class="p-2">
      <div class='p-4 border border-black rounded-sm w-[100px]' style={{
        "view-transition-name": 'testing'
      }}>
        <Link
          to='/quests/$questId'
          params={{ questId: '1' }}
          class=''
        >
          Test transition
        </Link>
      </div>
    </div>
  )
}
