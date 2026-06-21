"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { toolsByCategory } from "@/tools/registry";

export function Sidebar() {
  const pathname = usePathname();
  const groups = toolsByCategory();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/logo.png"
            alt="Office Dev Tools logo"
            width={20}
            height={20}
            className="size-5 dark:invert"
          />
          <span>Office Dev Tools</span>
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto p-2">
        {groups.map((group) => (
          <div
            key={group.category}
            className="flex flex-col gap-1 py-3 first:pt-1 last:pb-1"
          >
            <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground">
              {group.category}
            </p>
            {group.tools.map((tool) => {
              const href = `/tools/${tool.slug}`;
              const active = pathname === href || pathname === `${href}/`;
              return (
                <Link
                  key={tool.slug}
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-secondary font-medium text-secondary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <span>{tool.name}</span>
                  {tool.status === "placeholder" && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
