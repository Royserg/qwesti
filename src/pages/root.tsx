import { Transition } from 'solid-transition-group'
import { Component, ParentProps } from 'solid-js';

export const RootRoute: Component<ParentProps> = (props) => {
  return (
    <Transition
      mode="outin"
      onBeforeEnter={(el) => {
        if (el instanceof HTMLElement) el.style.opacity = '0';
      }}
      onEnter={(el, done) => {
        el.animate(
          [
            { opacity: 0, transform: 'translateY(50px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 300, fill: 'both' }
        )
          .finished.then(done)
          .catch(done);
      }}
      onExit={(el, done) => {
        el.animate(
          [
            { opacity: 1, transform: `translateY(0)` },
            { opacity: 0, transform: 'translateY(-50px)' },
          ],
          { duration: 300 }
        )
          .finished.then(done)
          .catch(done);
      }}
    >
      {props.children}
    </Transition>
  )
}
