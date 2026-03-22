import { focusManager } from '@tanstack/solid-query';
import { getCurrentWindow } from '@tauri-apps/api/window';

let queryFocusSyncInitialized = false;

const isTauriContext = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const setupQueryFocusSync = () => {
  if (queryFocusSyncInitialized || !isTauriContext()) {
    return;
  }

  queryFocusSyncInitialized = true;

  focusManager.setEventListener((setFocused) => {
    let disposed = false;
    let unlistenTauri: (() => void) | undefined;

    void (async () => {
      try {
        const appWindow = getCurrentWindow();
        const initiallyFocused = await appWindow.isFocused();

        if (!disposed) {
          setFocused(initiallyFocused);
        }

        const unlisten = await appWindow.onFocusChanged(({ payload }) => {
          setFocused(payload);
        });

        if (disposed) {
          unlisten();
          return;
        }

        unlistenTauri = unlisten;
      } catch (error) {
        console.warn('Failed to subscribe to Tauri focus events.', error);
      }
    })();

    return () => {
      disposed = true;
      unlistenTauri?.();
      unlistenTauri = undefined;
    };
  });
};
