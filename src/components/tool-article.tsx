import Link from "next/link";
import type { ReactNode } from "react";
import { parseInline, type InlineText, type ToolContent } from "@/lib/tool-content";

/**
 * Below-the-fold reference copy for a tool page, rendered as a sibling AFTER
 * the tool inside the scrolling <main>. `ToolLayout` is `min-h-full`, so the
 * tool alone still fills the first screen; the `mt-16` gap is larger than
 * main's bottom padding, so not even this article's top rule peeks above the
 * fold.
 *
 * The same `content` also feeds the FAQPage/HowTo JSON-LD
 * (src/lib/structured-data.ts); tool-article.test.ts keeps them in lockstep.
 */
export function ToolArticle({
  content,
  category,
}: {
  content: ToolContent;
  /** The tool's category hub, linked at the end of "Related tools". */
  category: { heading: string; href: string };
}) {
  return (
    <article
      data-tool-article
      className="mt-16 max-w-3xl space-y-10 border-t pt-10 pb-4 text-sm leading-relaxed"
    >
      <Section title="What this tool does">
        <p>
          <Inline text={content.intro} />
        </p>
      </Section>

      <Section title="How to use it">
        <ol className="list-decimal space-y-1.5 pl-5">
          {content.steps.map((step, index) => (
            <li key={index} className="pl-1">
              <Inline text={step} />
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Examples">
        <div className="space-y-8">
          {content.examples.map((example, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-semibold">
                <Inline text={example.title} />
              </h3>
              {example.note && (
                <p className="text-muted-foreground">
                  <Inline text={example.note} />
                </p>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <Sample label={example.inputLabel ?? "Input"} value={example.input} />
                <Sample label={example.outputLabel ?? "Output"} value={example.output} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Frequently asked questions">
        <div className="space-y-5" data-faq>
          {content.faq.map((entry, index) => (
            <div key={index} className="space-y-1" data-faq-item>
              <h3 className="font-semibold">{entry.question}</h3>
              <p>
                <Inline text={entry.answer} />
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Related tools">
        <p>
          <Inline text={content.related} />
        </p>
        <p className="text-muted-foreground">
          More in{" "}
          <Link href={category.href} className={LINK_CLASS}>
            {category.heading}
          </Link>
          .
        </p>
      </Section>
    </article>
  );
}

const LINK_CLASS =
  "font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Sample({ label, value }: { label: string; value: string }) {
  return (
    <figure className="min-w-0 space-y-1">
      <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>
      <pre className="overflow-x-auto rounded-md border bg-card p-3 font-mono text-xs leading-relaxed">
        {value}
      </pre>
    </figure>
  );
}

function Inline({ text }: { text: InlineText }) {
  return parseInline(text).map((node, index) => {
    switch (node.kind) {
      case "text":
        return node.text;
      case "code":
        return (
          <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {node.text}
          </code>
        );
      case "strong":
        return (
          <strong key={index} className="font-semibold">
            {node.text}
          </strong>
        );
      case "link":
        return (
          <Link key={index} href={node.href} className={LINK_CLASS}>
            {node.text}
          </Link>
        );
    }
  });
}
