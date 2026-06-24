import type { ReactNode } from "react";

/** Standard header + content frame shared by every tool page. */
export function ToolLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    // pb-4 adds a little breathing room below the bottom pane on mobile, where
    // the panes stack and the content scrolls; dropped at lg where the layout is
    // fixed-height two columns and the main padding already provides the gap.
    <div className="flex h-full flex-col gap-4 pb-4 lg:pb-0">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  );
}

/** Two-column input/output pane wrapper (stacks on small screens). */
export function ToolPanes({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-2">{children}</div>
  );
}

export function ToolPane({
  label,
  actions,
  controls,
  children,
}: {
  label: string;
  actions?: ReactNode;
  /** Optional controls rendered under the label row (e.g. format selectors). */
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex h-8 items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}
      {children}
    </section>
  );
}
