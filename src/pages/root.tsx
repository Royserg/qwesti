import { useParams } from '@solidjs/router';
import { Component, onMount, ParentProps, Show } from 'solid-js';
import { initStore } from '~/stores/quests';

export const RootRoute: Component<ParentProps> = (props) => {
  const params = useParams();

  onMount(() => {
    initStore();
  })

  return (<>{props.children}</>)

  /* NOTE: Show 'keyed' needed when navigating to the same page (sub-quests utilize the same page) 
   * and transition is not tirggered, because it needs to re-render */
  return (
    <Show when={params} keyed>
      {props.children}
    </Show>
  )
}
