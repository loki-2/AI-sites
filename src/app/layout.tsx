import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SchemaMarkup } from "@/components/SchemaMarkup";
import { generateOrganizationSchema } from "@/lib/seo/schemas";
import { AuthButton } from "@/components/AuthButton";
import { CreateProfileButton } from "@/components/CreateProfileButton";
import { FreelanceBannerWrapper } from "@/components/FreelanceBannerWrapper";
import { GigsNewsletterSection } from "@/components/GigsNewsletterSection";
import { GigsNewsletterModal } from "@/components/GigsNewsletterModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Script from "next/script";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vibecoders.news"),
  title: {
    default: "Find Best Vibecoders",
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
    siteName: "getVibecoderz",
    title: "getVibecoderz | Find Best Vibecoders",
    description: " A new place to showcase your projects, get seen and hired for freelance gigs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "getVibecoderz | Find Best Vibecoders",
    description: " A new place to showcase your projects, get seen and hired for freelance gigs.",
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
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-E1KWTYZ2L1" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E1KWTYZ2L1');
          `}
        </Script>
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
                  <a href="#gigs-newsletter">
                    <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-foreground">
                      Join & Subscribe
                    </Button>
                  </a>
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

          {/* Global verification banner above footer */}
          <FreelanceBannerWrapper />

          {/* Gigs Newsletter Section */}
          <div className=" w-full mx-auto bg-muted/40">
            <GigsNewsletterSection />
          </div>

          {/* Footer */}
          <footer className="border-t border-border bg-muted/40 mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-sm text-muted-foreground w-full flex flex-col items-center justify-center gap-3">
                  <p className="w-full">
                    <span className="text-foreground font-medium">
                      On-demand next gen web and mobile talent
                    </span>
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Link href="/privacy" className="hover:text-foreground transition-colors hover:underline">
                      Privacy Policy
                    </Link>
                    <Link href="/terms" className="hover:text-foreground transition-colors hover:underline">
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
