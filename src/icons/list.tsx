import { IconBase } from "./icon-base";

export default function List(props: { class?: string }) {
  return (
    <IconBase aria-hidden="true" class={props.class}>
      <rect x="2" y="3" width="2" height="2" />
      <rect x="6" y="3" width="8" height="2" />
      <rect x="2" y="7" width="2" height="2" />
      <rect x="6" y="7" width="8" height="2" />
      <rect x="2" y="11" width="2" height="2" />
      <rect x="6" y="11" width="8" height="2" />
    </IconBase>
  );
}
