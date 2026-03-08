import { IconBase } from "./icon-base";

export default function Minus(props: { class?: string }) {
  return (
    <IconBase aria-hidden="true" class={props.class}>
      <rect x="3" y="7" width="10" height="2" />
    </IconBase>
  );
}
