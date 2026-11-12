import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-paper/70 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary/8 text-primary">
          {icon}
        </div>
      ) : null}
      <h3 className="font-heading text-xl">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
