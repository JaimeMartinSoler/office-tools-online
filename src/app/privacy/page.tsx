import type { Metadata } from "next";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & Security",
  description:
    "How Office Dev Tools keeps your data private: everything runs client-side, nothing is ever sent to a server.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Lock className="size-6" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Privacy &amp; Security
        </h1>
      </div>

      <p className="text-muted-foreground">
        Office Dev Tools is built so that your data physically cannot reach
        us. This isn&apos;t a policy promise — it&apos;s how the site is built.
        The only thing measured is an anonymous, cookieless visit count; your
        input never leaves your browser.
      </p>

      <div className="space-y-4">
        <Section title="Everything runs in your browser">
          All conversions are performed locally in JavaScript on your device.
          Your input is never transmitted to a server for processing.
        </Section>
        <Section title="There is no backend">
          The site is a fully static export. There are no API routes, no server
          actions, and no database — there is simply nowhere for your data to be
          sent or stored.
        </Section>
        <Section title="No content telemetry">
          We do not send the contents of your inputs to any analytics or logging
          service. We use Cloudflare Web Analytics to count visits, which is
          cookieless and privacy-first: it records only the page address,
          referrer, and coarse device type — never what you type or convert.
        </Section>
        <Section title="Verify it yourself">
          Open your browser&apos;s developer tools, go to the Network tab, and
          use any tool. You will see that your input never leaves the page — the
          only outbound request is the anonymous Cloudflare visit beacon.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
