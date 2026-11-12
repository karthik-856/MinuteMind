import { UnassignedBadge } from "@/components/status-badges";
import { displayOwner, isUnassignedOwner } from "@/lib/owners";
import { cn } from "@/lib/utils";

export function OwnerLabel({
  owner,
  className,
}: {
  owner?: string;
  className?: string;
}) {
  if (isUnassignedOwner(owner)) {
    return <UnassignedBadge />;
  }
  return <span className={cn("text-sm", className)}>{displayOwner(owner)}</span>;
}
