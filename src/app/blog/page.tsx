import { getLatestArticles } from "@/lib/supabase/client";
import Link from "next/link";
import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
    weight: "400",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Blog | GetVibecoderz — Vibe Coding Insights",
    description: "Tutorials, stories, and insights from the vibe coding community. Learn how to build MVPs with AI tools, ship faster, and monetize your skills.",
    keywords: ["vibe coding", "AI tools", "build with AI", "indie hacker", "ship fast", "vibecoder blog", "AI native builders"],
    alternates: { canonical: "https://getvibecoderz.com/blog" },
    openGraph: {
        type: "website",
        url: "https://getvibecoderz.com/blog",
        title: "Blog | GetVibecoderz",
        description: "Tutorials, stories, and insights from the vibe coding community.",
        siteName: "GetVibecoderz",
    },
    twitter: {
        card: "summary",
        title: "Blog | GetVibecoderz",
        description: "Tutorials, stories, and insights from the vibe coding community.",
        creator: "@vibecoders",
    },
};

export const revalidate = 60; // Revalidate every 60s

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).toUpperCase();
}

export default async function BlogPage() {
    const articles = await getLatestArticles(50, 0);
    const blogs = articles.filter((a) => a.source === "notion-manual");

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-3">Blog</h1>
                    <p className="text-muted-foreground text-lg">
                        Insights, tutorials, and stories from the vibe coding community.
                    </p>
                </div>

                {/* Post list */}
                {blogs.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground">
                        <p className="text-5xl mb-4">✍️</p>
                        <p className="text-xl font-medium">No posts yet</p>
                        <p className="text-sm mt-2">
                            Add blogs in Notion and hit the sync URL to publish them here.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-12">
                        {blogs.map((post) => (
                            <article key={post.id} className="group border-b border-border/50 pb-12 last:border-0 hover:bg-muted/10 transition-colors rounded-xl md:-mx-4 md:px-4 md:pt-4">
                                <Link href={`/blog/${post.slug}`} className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Cover Image */}
                                    {post.coverImage && (
                                        <div className="shrink-0 w-full md:w-[280px] aspect-square rounded-md overflow-hidden bg-muted border border-border/30">
                                            <img
                                                src={post.coverImage}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        </div>
                                    )}
                                    {/* Content */}
                                    <div className="flex flex-col flex-1 py-2">
                                        <time
                                            dateTime={post.publishedAt.toISOString()}
                                            className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3 block"
                                        >
                                            {formatDate(post.publishedAt)}
                                        </time>
                                        <h2 className={cn("text-2xl md:text-4xl tracking-md text-foreground group-hover:text-primary transition-colors mb-4", instrumentSerif.className)} style={{ lineHeight: "1.1" }}>
                                            {post.title}
                                        </h2>
                                        {post.summary && (
                                            <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3 mb-6">
                                                {post.summary}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-auto">
                                            <div className="w-7 h-7 rounded-full bg-primary/20 overflow-hidden shrink-0 border border-border/50">
                                                <img src="/abhishek.png" alt="Abhishek" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                ABHISHEK
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
