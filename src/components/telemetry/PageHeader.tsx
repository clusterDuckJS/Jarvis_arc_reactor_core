import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, action }: PageHeaderProps): JSX.Element => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-reactor-primary/80">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-reactor-accent md:text-5xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-reactor-muted">{description}</p> : null}
    </div>
    {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
  </div>
);
