import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SchemaMarkup } from "@/components/SchemaMarkup";
import { generateOrganizationSchema } from "@/lib/seo/schemas";
import { AuthButton } from "@/components/AuthButton";
import { CreateProfileButton } from "@/components/CreateProfileButton";
import Link from "next/link";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
    <html lang="en" className="dark">
      <head>
        <SchemaMarkup schema={organizationSchema} />
      </head>
      <body
        className={`${manrope.variable} font-sans antialiased min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-background/80 backdrop-blur-md text-foreground sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight">
                    GetVibecoderz
                  </span>
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                  {/* <Link href="/" className="hover:text-primary transition-colors">Latest</Link>
                  <Link href="/" className="hover:text-primary transition-colors">News</Link>
                  <Link href="/" className="hover:text-primary transition-colors">Learning</Link> */}
                </nav>
                <div className="flex items-center gap-3">
                  <CreateProfileButton variant="outline" size="sm" className="hidden md:flex" hideWhenComplete>
                    Build Portfolio
                  </CreateProfileButton>
                  <AuthButton />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-border bg-muted/30 mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-sm text-muted-foreground w-full">
                  <p className="w-full">
                    <span className="text-foreground font-medium">
                      On-demand next gen web and mobile talent
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
