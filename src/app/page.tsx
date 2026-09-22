import Link from "next/link";
import { ToolCard } from "@/components/tool-card";
import { CSP_CONNECT_SRC, SITE_NAME, SITE_URL } from "@/lib/site";
import { categories } from "@/tools/categories";
import { tools, toolsByCategory } from "@/tools/registry";

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

const LINK_CLASS =
  "font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground";

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
      </section>

      {groups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {group.category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}

      {/* Below the grid on purpose: the tools stay the first thing you see. */}
      <section className="space-y-4 border-t pt-8 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold tracking-tight">
          What&apos;s different here
        </h2>
        <ul className="space-y-3 text-muted-foreground">
          <li>
            <strong className="font-semibold text-foreground">
              {tools.length} tools, one Ctrl+K palette.
            </strong>{" "}
            Press Ctrl+K (⌘K on a Mac) anywhere to jump to any tool by name or
            keyword. The tools share one layout and the same syntax-highlighting
            editor, so moving between them costs nothing.
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Hash algorithms most browser tools don&apos;t have.
            </strong>{" "}
            As well as MD5 and the SHA family, the{" "}
            <Link href="/tools/hash-generator/" className={LINK_CLASS}>
              Hash Generator
            </Link>{" "}
            runs BLAKE3, Argon2id, scrypt and bcrypt, compiled to WebAssembly and
            executed on your device.
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              No ads, no trackers, no sign-up.
            </strong>{" "}
            No accounts, no cookies, and no ad or tracking scripts — just the tools.
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              A strict Content-Security-Policy you can check.
            </strong>{" "}
            The site&apos;s <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">connect-src</code>{" "}
            is <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{CSP_CONNECT_SRC}</code>:
            your browser may only send data to this site&apos;s own origin and to
            Cloudflare&apos;s anonymous, cookieless page-view beacon — never
            anywhere else, and never your input.{" "}
            <Link href="/privacy/" className={LINK_CLASS}>
              How privacy works here
            </Link>
            .
          </li>
        </ul>
        <p className="text-muted-foreground">
          Browse by category:{" "}
          {categories.map((info, index) => (
            <span key={info.slug}>
              {index > 0 && " · "}
              <Link href={`/tools/${info.slug}/`} className={LINK_CLASS}>
                {info.heading}
              </Link>
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
