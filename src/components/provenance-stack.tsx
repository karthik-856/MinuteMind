import type { ReactNode } from "react";

export function ProvenanceStack({ children }: { children: ReactNode }) {
  return (
    <ol className="relative space-y-3 border-l border-primary/20 pl-4">
      {children}
    </ol>
  );
}

export function ProvenanceStep({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="relative">
      <span
        className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-brass ring-4 ring-paper"
        aria-hidden
      />
      <p className="kicker">{label}</p>
      <div className="mt-1.5 text-sm leading-6">{children}</div>
    </li>
  );
}
