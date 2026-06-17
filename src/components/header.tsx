import Link from "next/link";
import { Wrench } from "lucide-react";
import { ClientSideBadge } from "@/components/client-side-badge";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
        <Wrench className="size-5" />
        <span>Office Dev Tools</span>
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <ClientSideBadge className="hidden lg:inline-flex" />
        <CommandPalette />
        <ThemeToggle />
      </div>
    </header>
  );
}
