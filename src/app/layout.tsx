import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SchemaMarkup } from "@/components/SchemaMarkup";
import { generateOrganizationSchema } from "@/lib/seo/schemas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vibecoders.news"),
  title: {
    default: "VibeCoders News | AI-Curated Tech News for Builders",
    template: "%s | VibeCoders News",
  },
  description:
    "Daily curated news for vibe coders - builders who use AI tools to ship products fast. Get the latest on AI coding tools, no-code platforms, and indie maker news.",
  keywords: [
    "vibe coding",
    "AI tools",
    "AI coding",
    "cursor",
    "copilot",
    "claude code",
    "no-code",
    "developer news",
    "indie hacker",
    "solo founder",
    "LLM",
    "programming",
    "build fast",
    "ship fast",
  ],
  authors: [{ name: "VibeCoders News" }],
  creator: "VibeCoders News",
  publisher: "VibeCoders News",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "VibeCoders News",
    title: "VibeCoders News | AI-Curated Tech News for Builders",
    description: "AI-curated tech news for builders who ship fast. Daily digest of AI tools, coding workflows, and indie maker insights.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeCoders News | AI-Curated Tech News for Builders",
    description: "AI-curated tech news for builders who ship fast",
    creator: "@vibecoders",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema({
    name: "VibeCoders News",
    description: "AI-curated tech news for builders who ship fast",
    url: "https://vibecoders.news",
    logo: "https://vibecoders.news/logo.png",
  });

  return (
    <html lang="en">
      <head>
        <SchemaMarkup schema={organizationSchema} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-background sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight">
                    VibeCoders
                  </span>
                  <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 uppercase tracking-wider">
                    News
                  </span>
                </a>
                <nav className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-border bg-muted/30">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  <p>
                    AI-curated news for builders.{" "}
                    <span className="text-foreground font-medium">
                      Ship faster with better signal.
                    </span>
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Built with AI agents. Curated by humans.</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
