import { createFileRoute, useRouter } from '@tanstack/solid-router';
import { format } from 'date-fns';
import { createSignal, Show } from 'solid-js';
import { z } from 'zod';
import { addQuest, loadQuestsForDate } from '~/actions';
import { AddQuestDialog } from '~/components/add-quest-dialog/add-quest-dialog';
import { QuestsList } from '~/components/quests-list';
import { TodayDate } from '~/components/today-date';
import { Button } from '~/components/ui/button';
import { BaseLayout } from '~/layouts/base';
import { getTodayDate } from '~/lib/date';
import { BE_DATE_FROMAT } from '~/stores/date';

export const QuestsFilterEnum = z.enum(['all', "pending", "completed"]);
export type QuestsFilterEnumType = z.infer<typeof QuestsFilterEnum>;

const questsSearchSchema = z.object({
  filter: QuestsFilterEnum.default(QuestsFilterEnum.enum.all),
  date: z.string().optional().default(format(new Date(), BE_DATE_FROMAT)),
})

type QuestsSearch = z.infer<typeof questsSearchSchema>;

export const Route = createFileRoute('/')({
  component: Index,
  validateSearch: questsSearchSchema,
  loaderDeps: ({ search: { date, filter } }) => ({ date, filter }),
  loader: ({ deps }) => loadQuestsForDate(deps.date, deps.filter),
})

function Index() {
  const router = useRouter()
  const searchParams = Route.useSearch()
  const quests = Route.useLoaderData()

  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>()


  const isTodaySelected = () => {
    return searchParams().date === getTodayDate();
  }

  const closeDialog = () => {
    dialogRef()?.close();
  }

  const handleAddQuest = async (title: string) => {
    try {
      await addQuest({ title });
      closeDialog();
      router.invalidate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuestDeleted = () => {
    router.invalidate();
  }

  return (
    <BaseLayout class="relative flex flex-col pt-2">
      <div class="py-2" />

      <TodayDate />

      <div class="py-4" />

      <AddQuestDialog
        dialogRef={setDialogRef}
        onSubmit={handleAddQuest}
        onClose={closeDialog}
      />

      <section class="flex flex-1 flex-col gap-1 overflow-hidden px-4">
        <QuestsList
          quests={quests()}
          filter={searchParams().filter}
          onQuestDeleted={handleQuestDeleted}
        />
      </section>

      <Show when={isTodaySelected()}>
        <section
          style={{
            'view-transition-name': 'bottom-bar'
          }}
          class="mt-auto flex h-[70px] w-full items-center justify-center border-t pb-1">
          <Button
            class="h-[50px] w-3/5 rounded-xs"
            onClick={() => {
              dialogRef()?.showModal();
            }}
          >
            Add
          </Button>
        </section>
      </Show>
    </BaseLayout>
  );
}
