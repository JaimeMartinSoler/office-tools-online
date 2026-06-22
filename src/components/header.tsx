import { Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ClientSideBadge } from "@/components/client-side-badge";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Link
        href="/"
        className="flex min-w-0 items-center gap-2 font-semibold md:hidden"
      >
        <Image
          src="/logo.png"
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 dark:invert"
        />
        <span className="truncate">Office Dev Tools</span>
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <ClientSideBadge />
          <Link
            href="/about"
            aria-label="About"
            title="About"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
          >
            <Info className="size-3.5 shrink-0" />
            <span className="hidden whitespace-nowrap md:inline">About</span>
          </Link>
        </div>
        <CommandPalette />
        <ThemeToggle />
      </div>
    </header>
  );
}
