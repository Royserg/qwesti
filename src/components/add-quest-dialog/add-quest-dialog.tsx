import Drawer from "@corvu/drawer";
import X from "icons/x";
import {
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  type Component,
} from "solid-js";
import { Button } from "~/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string) => Promise<void>;
}

interface AddTaskBodyProps {
  open: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onClose: () => void;
  onSubmit: (event: Event) => Promise<void>;
  registerInput: (element: HTMLInputElement) => void;
  useDrawerA11y?: boolean;
  titleId: string;
  descriptionId: string;
}

const MOBILE_QUERY = "(max-width: 767px)";

const AddTaskBody: Component<AddTaskBodyProps> = (props) => {
  return (
    <form
      class="pixel-add-surface__form"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit(event);
      }}
    >
      <button
        type="button"
        onClick={props.onClose}
        class="pixel-icon-button absolute right-4 top-4 z-10 size-10"
        aria-label="Close create task surface"
      >
        <X />
      </button>

      <Show
        when={props.useDrawerA11y}
        fallback={
          <div class="pixel-add-surface__header">
            <h2 id={props.titleId} class="type-pixel text-xl">
              create new task
            </h2>
            <p id={props.descriptionId} class="type-copy text-sm text-[var(--muted-color)]">
              add a new task for the current day or branch.
            </p>
          </div>
        }
      >
        <div class="pixel-add-surface__header">
          <Drawer.Label id={props.titleId} class="type-pixel text-xl">
            create new task
          </Drawer.Label>
          <Drawer.Description id={props.descriptionId} class="type-copy text-sm text-[var(--muted-color)]">
            add a new task for the current day or branch.
          </Drawer.Description>
        </div>
      </Show>

      <input
        autocomplete="off"
        autoCapitalize="off"
        autocorrect="off"
        name="title"
        class="pixel-field"
        placeholder="create new task"
        ref={props.registerInput}
        value={props.title}
        onInput={(event) => props.onTitleChange(event.currentTarget.value)}
      />

      <div class="flex justify-end">
        <Button type="submit" class="min-w-[160px]">
          add task
        </Button>
      </div>
    </form>
  );
};

export const AddQuestDialog: Component<Props> = (props) => {
  let inputRef!: HTMLInputElement;
  const titleId = createUniqueId();
  const descriptionId = createUniqueId();
  const [title, setTitle] = createSignal("");
  const [isMobile, setIsMobile] = createSignal(false);

  const close = () => {
    props.onOpenChange(false);
  };

  const handleSubmit = async () => {
    const nextTitle = title().trim();
    if (!nextTitle) {
      return;
    }

    try {
      await props.onSubmit(nextTitle);
      setTitle("");
      props.onOpenChange(false);
    } catch {
      // Keep the drawer/dialog open and preserve the draft title on failure.
    }
  };

  onMount(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const syncMobile = () => setIsMobile(mediaQuery.matches);

    syncMobile();
    mediaQuery.addEventListener("change", syncMobile);

    onCleanup(() => {
      mediaQuery.removeEventListener("change", syncMobile);
    });
  });

  createEffect(() => {
    if (!props.open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef?.focus();
      inputRef?.select();
    });

    onCleanup(() => {
      window.cancelAnimationFrame(frame);
    });
  });

  createEffect(() => {
    if (!props.open || isMobile()) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <>
      <Show when={!isMobile() && props.open}>
        <div class="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
          <div class="pixel-overlay-scrim absolute inset-0" onClick={close} aria-hidden="true" />

          <div
            class="pixel-add-surface pixel-add-surface--dialog relative z-10 w-full max-w-[430px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onClick={(event) => event.stopPropagation()}
          >
            <AddTaskBody
              open={props.open}
              title={title()}
              onTitleChange={setTitle}
              onClose={close}
              onSubmit={handleSubmit}
              registerInput={(element) => {
                inputRef = element;
              }}
              titleId={titleId}
              descriptionId={descriptionId}
            />
          </div>
        </div>
      </Show>

      <Show when={isMobile()}>
        <Drawer
          open={props.open}
          onOpenChange={props.onOpenChange}
          side="bottom"
          snapPoints={[0, 1]}
          defaultSnapPoint={1}
          transitionResize
        >
          <Drawer.Overlay class="pixel-overlay-scrim absolute inset-0 z-40" />

          <Drawer.Content class="pixel-add-surface pixel-add-surface--drawer absolute inset-x-0 bottom-0 z-50 flex max-h-[min(78vh,520px)] flex-col outline-none">
            <div class="flex justify-center px-4 pt-3">
              <div class="pixel-add-surface__handle" />
            </div>

            <AddTaskBody
              open={props.open}
              title={title()}
              onTitleChange={setTitle}
              onClose={close}
              onSubmit={handleSubmit}
              registerInput={(element) => {
                inputRef = element;
              }}
              useDrawerA11y
              titleId={titleId}
              descriptionId={descriptionId}
            />
          </Drawer.Content>
        </Drawer>
      </Show>
    </>
  );
};
