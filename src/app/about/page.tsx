import type { Metadata } from "next";
import { Github, Info } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const REPO_URL = "https://github.com/JaimeMartinSoler/office-tools-online";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Office Dev Tools — built by Jaime Martín Soler with the help of Claude. View the source on GitHub.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-center gap-3">
        <Info className="size-6" />
        <h1 className="text-2xl font-semibold tracking-tight">About</h1>
      </div>

      <p className="text-center text-lg text-muted-foreground">
        This page has been created by Jaime Martín Soler with the help of
        Claude...
        <br />
        or probably viceversa... 😅
      </p>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-sm text-muted-foreground">
          The whole project is open source. Take a look at the code, open an
          issue, or just have a browse.
        </p>
        <div className="mt-4 flex justify-center">
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
      </div>
    </div>
  );
}
