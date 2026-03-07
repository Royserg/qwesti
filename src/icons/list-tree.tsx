import { IconBase } from "./icon-base";

export default function ListTree(props: { class?: string }) {
  return (
    <IconBase aria-hidden="true" class={props.class}>
      <rect x="2" y="2" width="2" height="2" />
      <rect x="2" y="4" width="2" height="6" />
      <rect x="4" y="8" width="4" height="2" />
      <rect x="8" y="8" width="2" height="2" />
      <rect x="6" y="4" width="8" height="2" />
      <rect x="10" y="10" width="4" height="2" />
    </IconBase>
  );
}
