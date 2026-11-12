import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1 className="font-heading mt-1.5 max-w-3xl text-4xl leading-[1.08] tracking-tight text-balance break-words sm:text-5xl">
          {title}
        </h1>
        <div className="ink-rule" />
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
