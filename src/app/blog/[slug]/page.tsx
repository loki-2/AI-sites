import { getArticleBySlug } from "@/lib/supabase/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) return { title: "Not Found" };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getvibecoderz.com";
    const url = `${baseUrl}/blog/${slug}`;

    return {
        title: `${article.title} | GetVibecoderz Blog`,
        description: article.summary ?? undefined,
        alternates: { canonical: url },
        openGraph: {
            type: "article",
            url,
            title: article.title,
            description: article.summary ?? undefined,
            publishedTime: article.publishedAt.toISOString(),
            siteName: "GetVibecoderz",
            images: article.coverImage
                ? [{ url: article.coverImage, width: 1200, height: 630, alt: article.title }]
                : [],
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.summary ?? undefined,
            creator: "@vibecoders",
            images: article.coverImage ? [article.coverImage] : [],
        },
    };
}

// -------------------------------------------
// Markdown → HTML renderer (no deps needed)
// -------------------------------------------
function markdownToHtml(md: string): string {
    const lines = md.split("\n");
    const htmlParts: string[] = [];
    let inCode = false;
    let codeLang = "";
    let codeBuf: string[] = [];
    let inList = false;
    let listType: "ul" | "ol" = "ul";

    const flushList = () => {
        if (inList) {
            htmlParts.push(listType === "ul" ? "</ul>" : "</ol>");
            inList = false;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code fence
        if (line.startsWith("```")) {
            if (!inCode) {
                flushList();
                inCode = true;
                codeLang = line.slice(3).trim();
                codeBuf = [];
            } else {
                inCode = false;
                const escaped = codeBuf
                    .join("\n")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                htmlParts.push(
                    `<pre class="blog-code" data-lang="${codeLang}"><code>${escaped}</code></pre>`
                );
                codeLang = "";
                codeBuf = [];
            }
            continue;
        }

        if (inCode) {
            codeBuf.push(line);
            continue;
        }

        // Headings
        if (line.startsWith("# ")) {
            flushList();
            htmlParts.push(`<h1 class="blog-h1">${inlineFormat(line.slice(2))}</h1>`);
            continue;
        }
        if (line.startsWith("## ")) {
            flushList();
            htmlParts.push(`<h2 class="blog-h2">${inlineFormat(line.slice(3))}</h2>`);
            continue;
        }
        if (line.startsWith("### ")) {
            flushList();
            htmlParts.push(`<h3 class="blog-h3">${inlineFormat(line.slice(4))}</h3>`);
            continue;
        }

        // Horizontal rule
        if (line.trim() === "---") {
            flushList();
            htmlParts.push(`<hr class="blog-hr" />`);
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            flushList();
            htmlParts.push(
                `<blockquote class="blog-quote">${inlineFormat(line.slice(2))}</blockquote>`
            );
            continue;
        }

        // Unordered list
        if (line.startsWith("- ")) {
            if (!inList || listType !== "ul") {
                flushList();
                htmlParts.push(`<ul class="blog-ul">`);
                inList = true;
                listType = "ul";
            }
            htmlParts.push(`<li>${inlineFormat(line.slice(2))}</li>`);
            continue;
        }

        // Ordered list
        if (/^\d+\. /.test(line)) {
            if (!inList || listType !== "ol") {
                flushList();
                htmlParts.push(`<ol class="blog-ol">`);
                inList = true;
                listType = "ol";
            }
            htmlParts.push(`<li>${inlineFormat(line.replace(/^\d+\. /, ""))}</li>`);
            continue;
        }

        // Image
        const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
            flushList();
            htmlParts.push(
                `<figure class="blog-figure"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="blog-img" />${imgMatch[1] ? `<figcaption class="blog-caption">${imgMatch[1]}</figcaption>` : ""}</figure>`
            );
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            flushList();
            continue;
        }

        // Paragraph
        flushList();
        htmlParts.push(`<p class="blog-p">${inlineFormat(line)}</p>`);
    }

    flushList();
    return htmlParts.join("\n");
}

function inlineFormat(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Bold+italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Strikethrough
        .replace(/~~(.+?)~~/g, "<del>$1</del>")
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="blog-inline-code">$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="blog-link" target="_blank" rel="noopener noreferrer">$1</a>');
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) notFound();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getvibecoderz.com";
    const pageUrl = `${baseUrl}/blog/${slug}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.summary ?? "",
        url: pageUrl,
        datePublished: article.publishedAt.toISOString(),
        dateModified: article.publishedAt.toISOString(),
        author: { "@type": "Person", name: "Abhishek" },
        publisher: {
            "@type": "Organization",
            name: "GetVibecoderz",
            logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` },
        },
        ...(article.coverImage && {
            image: { "@type": "ImageObject", url: article.coverImage },
        }),
    };

    const html = markdownToHtml(article.content ?? "");

    return (
        <div className="min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-3xl mx-auto px-4 py-16">
                {/* Back */}
                <Link
                    href="/blog"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-flex items-center gap-1"
                >
                    ← All posts
                </Link>

                {/* Cover */}
                {article.coverImage && (
                    <div className="mt-6 mb-10 rounded-xl overflow-hidden aspect-video bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Header */}
                <header className="mb-10">
                    <time
                        dateTime={article.publishedAt.toISOString()}
                        className="text-xs text-muted-foreground uppercase tracking-wide"
                    >
                        {formatDate(article.publishedAt)}
                    </time>
                    <h1 className="text-4xl font-bold tracking-tight mt-3 mb-4 leading-tight">
                        {article.title}
                    </h1>
                    {article.summary && (
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {article.summary}
                        </p>
                    )}
                </header>

                <hr className="border-border mb-10" />

                {/* Content */}
                <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: html }}
                />

                {/* Back to blog */}
                <div className="mt-16 pt-8 border-t border-border">
                    <Link
                        href="/blog"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                        ← Back to all posts
                    </Link>
                </div>
            </div>

            {/* Blog content styles */}
            <style>{`
        .blog-content { font-size: 1.2rem; line-height: 1.8; color: var(--foreground); }
        .blog-h1 { font-size: 2rem; font-weight: 700; margin: 2.5rem 0 1rem; line-height: 1.25; }
        .blog-h2 { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 0.75rem; line-height: 1.3; }
        .blog-h3 { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 0.5rem; line-height: 1.4; }
        .blog-p { margin: 1rem 0; color: var(--gray-400); letter-spacing: normal; }
        .blog-ul, .blog-ol { margin: 1rem 0 1rem 1.5rem; color: var(--gray-300); }
        .blog-ul { list-style: disc; }
        .blog-ol { list-style: decimal; }
        .blog-ul li, .blog-ol li { margin: 0.4rem 0; }
        .blog-quote { border-left: 3px solid var(--primary); padding: 0.5rem 1rem; margin: 1.5rem 0; color: var(--muted-foreground); font-style: italic; background: var(--muted); border-radius: 0 0.375rem 0.375rem 0; }
        .blog-code { background: var(--muted); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.25rem; overflow-x: auto; font-size: 0.875rem; margin: 1.5rem 0; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        .blog-code code { white-space: pre; }
        .blog-inline-code { background: var(--muted); border: 1px solid var(--border); border-radius: 0.25rem; padding: 0.1rem 0.3rem; font-size: 0.875em; font-family: monospace; }
        .blog-link { color: var(--primary); text-decoration: underline; text-underline-offset: 2px; }
        .blog-link:hover { opacity: 0.8; }
        .blog-hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
        .blog-figure { margin: 2rem 0; }
        .blog-img { border-radius: 0.75rem; width: 100%; height: auto; }
        .blog-caption { text-align: center; font-size: 0.85rem; color: var(--muted-foreground); margin-top: 0.5rem; }
      `}</style>
        </div>
    );
}
