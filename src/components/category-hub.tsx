import Link from "next/link";
import { jsonLdScriptContent, categoryStructuredData } from "@/lib/structured-data";
import { categories, type CategoryInfo } from "@/tools/categories";
import { menuEntries } from "@/tools/registry";
import { ToolCard } from "./tool-card";

/** The /tools/<category>/ index page: intro copy plus the category's tools. */
export function CategoryHub({ info }: { info: CategoryInfo }) {
  const members = menuEntries.filter((entry) => entry.category === info.category);
  const others = categories.filter((other) => other.slug !== info.slug);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(categoryStructuredData(info)) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="px-1.5" aria-hidden>
          /
        </span>
        <span aria-current="page" className="text-foreground">
          {info.heading}
        </span>
      </nav>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{info.heading}</h1>
        <p className="max-w-2xl text-muted-foreground">{info.intro}</p>
      </section>

      <section className="space-y-3">
        <h2 className="sr-only">Tools in this category</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <nav aria-label="Other categories" className="border-t pt-6 text-sm text-muted-foreground">
        Other categories:{" "}
        {others.map((other, index) => (
          <span key={other.slug}>
            {index > 0 && " · "}
            <Link
              href={`/tools/${other.slug}/`}
              className="font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              {other.heading}
            </Link>
          </span>
        ))}
      </nav>
    </div>
  );
}
