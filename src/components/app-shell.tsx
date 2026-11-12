"use client";

import { BrandMark } from "@/components/brand-mark";
import { FeatherField } from "@/components/feather-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  AlertTriangleIcon,
  BotIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  MenuIcon,
  NotebookPenIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/meetings", label: "Meetings", icon: NotebookPenIcon },
  { href: "/tasks", label: "Tasks", icon: ClipboardListIcon },
  { href: "/risks", label: "Risks", icon: AlertTriangleIcon },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheckIcon },
  { href: "/agents", label: "Agents", icon: BotIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[16.5rem] flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(460px_300px_at_18%_-12%,oklch(0.5_0.12_164/0.45),transparent_68%)]" />
        <div className="pointer-events-none absolute inset-y-8 right-0 w-px bg-gradient-to-b from-transparent via-brass/40 to-transparent" />
        <div className="relative flex h-full flex-col">
          <Brand />
          <p className="px-6 pt-4 pb-2 text-[10px] font-medium tracking-[0.28em] text-brass/80 uppercase">
            Workspace
          </p>
          <Nav pathname={pathname} />
          <div className="mt-auto space-y-3 p-4">
            <Button
              className="w-full bg-white text-sidebar shadow-[0_10px_24px_oklch(0.12_0.03_240/0.35)] hover:bg-paper"
              render={<Link href="/meetings/new" />}
            >
              <PlusIcon data-icon="inline-start" />
              Process meeting
            </Button>
            <p className="px-1 text-[11px] leading-4 text-white/48">
              Local-first · six agents · source quotes
            </p>
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 overflow-x-clip lg:pl-[16.5rem]">
        <FeatherField className="z-0" />
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open navigation"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <Brand />
              <Nav pathname={pathname} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="font-heading min-w-0 flex-1 truncate text-xl">MinuteMind</p>
          <Button size="sm" render={<Link href="/meetings/new" />}>
            <PlusIcon data-icon="inline-start" />
            New
          </Button>
        </header>
        <main className="relative z-10 mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-11">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="relative border-b border-white/8 px-5 py-7">
      <Link href="/" className="flex items-center gap-3">
        <BrandMark />
        <span>
          <p className="font-heading text-[1.35rem] tracking-tight text-white">MinuteMind</p>
          <p className="mt-0.5 text-[11px] leading-4 tracking-wide text-white/52">
            Conversation → execution
          </p>
        </span>
      </Link>
    </div>
  );
}

function Nav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              active
                ? "bg-white/13 text-white shadow-[inset_0_0_0_1px_oklch(1_0_0/0.07)]"
                : "text-white/66 hover:translate-x-0.5 hover:bg-white/8 hover:text-white",
            )}
          >
            {active ? (
              <span className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brass" />
            ) : null}
            <Icon className="size-4 shrink-0 opacity-90" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
