import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reactor-primary focus-visible:ring-offset-2 focus-visible:ring-offset-reactor-bg disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-reactor-primary/50 bg-reactor-primary text-reactor-bg shadow-bloom hover:bg-reactor-secondary",
        secondary:
          "border-reactor-secondary/20 bg-white/5 text-reactor-accent hover:border-reactor-secondary/[0.45] hover:bg-white/10 hover:shadow-bloom",
        ghost:
          "border-transparent bg-transparent text-reactor-accent hover:border-reactor-secondary/20 hover:bg-white/[0.06]",
        danger:
          "border-reactor-danger/50 bg-reactor-danger/[0.12] text-reactor-danger shadow-danger hover:bg-reactor-danger/20",
        icon:
          "size-10 border-reactor-secondary/[0.15] bg-white/5 p-0 text-reactor-secondary hover:border-reactor-secondary/[0.45] hover:bg-white/10 hover:shadow-bloom",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps): JSX.Element => {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
};

export { buttonVariants };
