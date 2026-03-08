import { IconBase } from "./icon-base";

export default function Settings(props: { class?: string }) {
  return (
    <IconBase aria-hidden="true" class={props.class}>
      <rect x="6" y="2" width="4" height="2" />
      <rect x="4" y="4" width="2" height="2" />
      <rect x="10" y="4" width="2" height="2" />
      <rect x="2" y="6" width="2" height="4" />
      <rect x="12" y="6" width="2" height="4" />
      <rect x="4" y="10" width="2" height="2" />
      <rect x="10" y="10" width="2" height="2" />
      <rect x="6" y="12" width="4" height="2" />
      <rect x="6" y="6" width="4" height="4" />
    </IconBase>
  );
}
