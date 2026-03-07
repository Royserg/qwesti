import type { JSX, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

import * as ButtonPrimitive from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "pixel-button whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive: "bg-[var(--line-color)] text-[var(--panel-color)] hover:bg-[var(--line-color)]",
        outline: "pixel-button--ghost",
        secondary: "bg-[var(--panel-muted-color)] text-[var(--ink-color)] hover:bg-[var(--accent-soft-color)]",
        ghost: "pixel-button--ghost",
        link: "pixel-button--ghost underline underline-offset-4",
      },
      size: {
        default: "",
        sm: "min-h-[42px] px-3 text-[0.72rem]",
        lg: "min-h-[56px] px-8 text-[0.84rem]",
        icon: "size-[54px] px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps<T extends ValidComponent = "button"> =
  ButtonPrimitive.ButtonRootProps<T> &
    VariantProps<typeof buttonVariants> & {
      class?: string | undefined;
      children?: JSX.Element;
    };

const Button = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, ButtonProps<T>>,
) => {
  const [local, others] = splitProps(props as ButtonProps, [
    "variant",
    "size",
    "class",
  ]);
  return (
    <ButtonPrimitive.Root
      class={cn(
        buttonVariants({ variant: local.variant, size: local.size }),
        local.class,
      )}
      {...others}
    />
  );
};

export type { ButtonProps };
export { Button, buttonVariants };
