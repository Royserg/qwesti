declare module "solid-js" {
  namespace JSX {
    interface Directives {
      setFocus: true;
    }
  }
}

export const setFocus = (el: HTMLElement) => setTimeout(() => el.focus());
