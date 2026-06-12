import { Clipboard, Construction } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";

/**
 * Placeholder tool. Intentionally does nothing in v1 (see docs/TOOLS.md) — it
 * exists so the route and menu entry are present. No backend, no logic.
 */
export function ClipboardSharing() {
  return (
    <ToolLayout
      title="Clipboard Sharing"
      description="Share clipboard contents across your devices."
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-md border border-dashed py-20 text-center">
        <div className="relative">
          <Clipboard className="size-12 text-muted-foreground" />
          <Construction className="absolute -bottom-1 -right-1 size-6 text-amber-500" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">Coming soon</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This tool isn&apos;t available yet. When it ships, it will stay true
            to our promise — your data handled locally, never on a server.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
