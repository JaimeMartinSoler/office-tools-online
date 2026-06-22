import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OG_IMAGE } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const DEFAULT_TITLE = "Office Dev Tools — private, client-side dev utilities";
const DEFAULT_DESCRIPTION =
  "A fast, privacy-first collection of online developer tools — JSON formatter & converter, Base64 encoder, hash generator, password generator, URL encoder, timestamp and number base converters, and more. Every conversion runs entirely in your browser; nothing is ever uploaded.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  // Browser tab text is always just the brand name. The template has no `%s`,
  // so any per-page title (Privacy, About, each tool) still resolves to the
  // constant "Office Dev Tools" in the tab. Social-card titles below stay
  // descriptive for SEO/sharing.
  title: {
    default: "Office Dev Tools",
    template: "Office Dev Tools",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "online tools",
    "developer tools",
    "json formatter",
    "json converter",
    "base64 encoder",
    "hash generator",
    "password generator",
    "url encoder",
    "jwt decoder",
    "uuid generator",
    "number base converter",
    "unix timestamp converter",
    "privacy",
    "client-side",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "256x256", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider delayDuration={300}>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  {children}
                </main>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
