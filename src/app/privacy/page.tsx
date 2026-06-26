import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Lock, LaptopMinimalCheck, ServerOff, EyeOff, SearchCode } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & Security",
  description:
    "How Office Dev Tools keeps your data private: everything runs client-side, your input is never sent to a server.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-center gap-3">
        <Lock className="size-6" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Privacy &amp; Security
        </h1>
      </div>

      <p className="text-center text-lg text-muted-foreground">
        Office Dev Tools is built so that your data physically cannot reach us.
        <br />
        This isn&apos;t a policy promise, it&apos;s how the site is built.
      </p>

      <div className="space-y-4">
        <Section icon={LaptopMinimalCheck} title="Everything runs in your browser">
          All conversions are performed locally in JavaScript on your device.
          Your input is never transmitted to a server for processing.
        </Section>
        <Section icon={ServerOff} title="There is no backend">
          The site is a fully static export. There are no API routes, no server
          actions, and no database, there is simply nowhere for your data to be
          sent or stored.
        </Section>
        <Section icon={EyeOff} title="No content telemetry">
          We do not send the contents of your inputs to any analytics or logging
          service. The page sends a single request on load, to the visits counter,
          and nothing else.
        </Section>
        <Section icon={SearchCode} title="Verify it yourself">
          Open your browser&apos;s developer tools, go to the Network tab, and
          use any tool. You will see that your input never leaves the page.
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="flex items-center gap-2 font-medium">
        <Icon className="size-4 shrink-0" />
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
