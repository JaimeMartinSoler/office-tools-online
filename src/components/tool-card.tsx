import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { isExternalTool, type MenuEntry } from "@/tools/registry";

/** A tool tile for the homepage grid and the /tools/<category>/ hubs. */
export function ToolCard({ tool }: { tool: MenuEntry }) {
  const external = isExternalTool(tool);
  return (
    <Link
      href={external ? tool.url : `/tools/${tool.slug}`}
      {...(external && {
        target: "_blank",
        rel: "noopener noreferrer",
      })}
      className="group flex flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{tool.name}</h3>
        {external && (
          <>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="sr-only">(opens in a new tab)</span>
          </>
        )}
        {!external && tool.status === "placeholder" && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            soon
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{tool.description}</p>
    </Link>
  );
}
