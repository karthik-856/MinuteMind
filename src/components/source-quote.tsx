import { cn } from "@/lib/utils";

export function SourceQuote({
  quote,
  className,
  emphasized = false,
}: {
  quote?: string;
  className?: string;
  emphasized?: boolean;
}) {
  if (!quote) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No source sentence was stored for this item.
      </p>
    );
  }
  return (
    <blockquote
      className={cn(
        "rounded-r-lg border-l-2 border-primary/50 bg-paper px-3 py-2 text-sm leading-6 text-foreground/90",
        emphasized &&
          "rounded-xl border border-brass/20 border-l-[3px] border-l-brass bg-white px-4 py-3.5 font-heading text-[17px] leading-7 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.7)]",
        className,
      )}
    >
      “{quote}”
    </blockquote>
  );
}
