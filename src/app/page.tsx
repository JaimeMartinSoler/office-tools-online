import Link from "next/link";
import { ClientSideBadge } from "@/components/client-side-badge";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { toolsByCategory } from "@/tools/registry";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description:
        "A privacy-first collection of browser-based utilities for developers and office work. Every conversion runs entirely in the browser.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function HomePage() {
  const groups = toolsByCategory();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Office Dev Tools</h1>
        <p className="max-w-2xl text-muted-foreground">
          A fast, privacy-first collection of utilities for developers and office
          work. Every conversion runs entirely in your browser.
        </p>
        <ClientSideBadge />
      </section>

      {groups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {group.category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{tool.name}</h3>
                  {tool.status === "placeholder" && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
