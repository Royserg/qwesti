import { IconBase } from "./icon-base";

export default function ChevronLeft(props: { class?: string }) {
  return (
    <IconBase aria-hidden="true" class={props.class}>
      <rect x="10" y="2" width="2" height="2" />
      <rect x="8" y="4" width="2" height="2" />
      <rect x="6" y="6" width="2" height="2" />
      <rect x="8" y="8" width="2" height="2" />
      <rect x="10" y="10" width="2" height="2" />
    </IconBase>
  );
}
