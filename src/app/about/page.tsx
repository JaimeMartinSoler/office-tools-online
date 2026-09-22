import { Github, Info } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CLIPBOARD_SHARING_URL } from "@/lib/site";

const REPO_URL = "https://github.com/JaimeMartinSoler/office-tools-online";

const OTHER_SITES = [
  {
    name: "clipboard-sharing-online.com",
    url: CLIPBOARD_SHARING_URL,
    icon: "/icon-clipboard-sharing-online.png",
    description:
      "Share text between your phone, PC, laptop and tablet by typing the same password on each — end-to-end encrypted in your browser, so the server only ever stores ciphertext it cannot read",
  },
  {
    name: "nothing-at-all.com",
    url: "https://nothing-at-all.com",
    icon: "/icon-nothing-at-all.svg",
    description: "Well... it's nothing... but interesting... or not... just check",
  },
];

export const metadata: Metadata = {
  title: "About",
  description:
    "About Office Dev Tools — built by Jaime Martín Soler. View the source on GitHub.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Info className="size-6" />
          <h1 className="text-2xl font-semibold tracking-tight">About</h1>
        </div>

        <section className="space-y-3 rounded-lg border bg-card p-6">
          <div className="flex justify-center">
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg" })}
            >
              <Github className="size-4" />
              office-tools-online
            </Link>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Take a look at the code, open an issue, or just have a browse
          </p>
        </section>

        <div className="space-y-3">
          <h2 className="text-center text-lg font-semibold tracking-tight">
            Other useful websites
          </h2>
          {OTHER_SITES.map((site) => (
            <section
              key={site.url}
              className="space-y-3 rounded-lg border bg-card p-6"
            >
              <div className="flex flex-col items-center gap-2">
                <Link
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "lg",
                  })}
                >
                  <Image
                    src={site.icon}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4"
                  />
                  {site.name}
                </Link>
                <p className="w-full text-center text-sm text-muted-foreground">
                  {site.description}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <p className="mt-auto pt-6 text-center text-muted-foreground">
        This page has been created by Jaime Martín Soler
      </p>
    </div>
  );
}
