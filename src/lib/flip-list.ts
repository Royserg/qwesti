import { onCleanup } from "solid-js";

interface Options {
  duration?: number;
  easing?: string;
  getSkippedId?: () => string | null;
}

const DEFAULT_DURATION = 220;
const DEFAULT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export const createFlipListAnimator = (options: Options = {}) => {
  const elements = new Map<string, HTMLElement>();
  const previousRects = new Map<string, DOMRect>();
  const animations = new Map<string, Animation>();
  const duration = options.duration ?? DEFAULT_DURATION;
  const easing = options.easing ?? DEFAULT_EASING;
  let frameId: number | undefined;

  const cancelFrame = () => {
    if (frameId !== undefined) {
      window.cancelAnimationFrame(frameId);
      frameId = undefined;
    }
  };

  const cancelAnimation = (id: string) => {
    const animation = animations.get(id);
    if (animation) {
      animation.cancel();
      animations.delete(id);
    }
  };

  const measure = () => {
    const nextRects = new Map<string, DOMRect>();

    for (const [id, element] of elements) {
      nextRects.set(id, element.getBoundingClientRect());
    }

    return nextRects;
  };

  const commit = (rects: Map<string, DOMRect>) => {
    previousRects.clear();
    for (const [id, rect] of rects) {
      previousRects.set(id, rect);
    }
  };

  const animate = () => {
    frameId = undefined;
    const skippedId = options.getSkippedId?.() ?? null;
    const nextRects = measure();

    for (const [id, nextRect] of nextRects) {
      if (id === skippedId) {
        cancelAnimation(id);
        continue;
      }

      const previousRect = previousRects.get(id);
      if (!previousRect) {
        continue;
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        continue;
      }

      const element = elements.get(id);
      if (!element) {
        continue;
      }

      cancelAnimation(id);

      const animation = element.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0px, 0px)" },
        ],
        {
          duration,
          easing,
        },
      );

      animation.onfinish = () => {
        if (animations.get(id) === animation) {
          animations.delete(id);
        }
      };

      animation.oncancel = () => {
        if (animations.get(id) === animation) {
          animations.delete(id);
        }
      };

      animations.set(id, animation);
    }

    commit(nextRects);
  };

  const schedule = () => {
    cancelFrame();
    frameId = window.requestAnimationFrame(animate);
  };

  const register = (id: string) => (element: Element | undefined) => {
    const previousElement = elements.get(id);
    if (previousElement && previousElement !== element) {
      cancelAnimation(id);
      elements.delete(id);
      previousRects.delete(id);
    }

    if (element instanceof HTMLElement) {
      elements.set(id, element);
      if (!previousRects.has(id)) {
        previousRects.set(id, element.getBoundingClientRect());
      }
      return;
    }

    cancelAnimation(id);
    elements.delete(id);
    previousRects.delete(id);
  };

  onCleanup(() => {
    cancelFrame();
    for (const id of animations.keys()) {
      cancelAnimation(id);
    }
    elements.clear();
    previousRects.clear();
  });

  return {
    register,
    schedule,
  };
};
