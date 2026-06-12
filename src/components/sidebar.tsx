"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { toolsByCategory } from "@/tools/registry";

export function Sidebar() {
  const pathname = usePathname();
  const groups = toolsByCategory();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Wrench className="size-5" />
          <span>Office Tools</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-6 overflow-y-auto p-4">
        {groups.map((group) => (
          <div key={group.category} className="flex flex-col gap-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
