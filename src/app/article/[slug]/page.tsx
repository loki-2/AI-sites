import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArticleBySlug, getLatestArticles } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/ArticleCard";
import { SchemaMarkup } from "@/components/SchemaMarkup";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/seo/schemas";
import type { Metadata } from "next";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | VibeCoders News",
    };
  }

  return {
    title: `${article.title} | VibeCoders News`,
    description: article.summary || article.content.slice(0, 160),
    keywords: article.tags,
    authors: [{ name: "VibeCoders News" }],
    openGraph: {
      title: article.title,
      description: article.summary || article.content.slice(0, 160),
      type: "article",
      publishedTime: article.publishedAt.toISOString(),
      tags: article.tags,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary || article.content.slice(0, 160),
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Get related articles (latest ones excluding current)
  const latestArticles = await getLatestArticles(4);
  const relatedArticles = latestArticles.filter((a) => a.slug !== slug).slice(0, 3);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibecoders.news";
  const coverImage = article.coverImage || '/article-placeholder.png';

  // Generate schema markup for SEO
  const articleSchema = generateArticleSchema({
    headline: article.title,
    description: article.summary || article.content.slice(0, 160),
    datePublished: article.publishedAt.toISOString(),
    image: article.coverImage || `${baseUrl}/og-image.png`,
    url: `${baseUrl}/article/${article.slug}`,
    publisher: {
      name: "VibeCoders News",
      logo: `${baseUrl}/logo.png`,
    },
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: article.title },
  ]);

  return (
    <>
      <SchemaMarkup schema={[articleSchema, breadcrumbSchema]} />

      {/* Cover Image */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-muted">
        <Image
          src={coverImage}
          alt={article.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          ← Back to all articles
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          {/* Category Badge */}
          {article.category && (
            <Badge className="mb-4 bg-primary text-primary-foreground font-semibold uppercase tracking-wider">
              {article.category === "actionable" ? "LEARNING" : "NEWS"}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Author and Date */}
          <div className="flex items-center gap-3 text-muted-foreground text-sm md:text-base">
            <span className="font-semibold">Abhishek</span>
            <span>·</span>
            <time dateTime={article.publishedAt.toISOString()}>
              {formattedDate}
            </time>
          </div>
        </header>

        {/* Summary */}
        {article.summary && (
          <div className="mb-8 p-6 bg-muted/30 border-l-4 border-primary">
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-medium">
              {article.summary}
            </p>
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Separator className="my-8" />

        {/* Article Body - Improved Typography with Markdown Support */}
        <div className="article-content">
          {article.content.split("\n").map((line, index) => {
            // Render H2 headings
            if (line.startsWith("## ")) {
              return (
                <h2 key={index} className="text-2xl md:text-3xl font-bold text-foreground mt-8 mb-4">
                  {line.replace("## ", "")}
                </h2>
              );
            }

            // Render bullet points
            if (line.startsWith("- ")) {
              return (
                <li key={index} className="ml-6 mb-3 text-lg leading-relaxed text-foreground/90 list-disc">
                  {line.replace("- ", "")}
                </li>
              );
            }

            // Render numbered lists
            if (/^\d+\.\s/.test(line)) {
              return (
                <li key={index} className="ml-6 mb-3 text-lg leading-relaxed text-foreground/90 list-decimal">
                  {line.replace(/^\d+\.\s/, "")}
                </li>
              );
            }

            // Render empty lines as spacing
            if (line.trim() === "") {
              return <div key={index} className="h-2" />;
            }

            // Render regular paragraphs
            return (
              <p key={index} className="mb-4 text-lg leading-relaxed text-foreground/90">
                {line}
              </p>
            );
          })}
        </div>

        {/* Source Link */}
        {article.originalUrl && (
          <div className="mt-12 p-6 bg-muted/30 border border-border rounded-lg">
            <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Original Source
            </p>
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-primary hover:underline break-all font-medium"
            >
              {article.originalUrl}
            </a>
          </div>
        )}

        {/* Share Actions */}
        <div className="mt-8 flex items-center gap-4">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Share:
          </span>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                article.title
              )}&url=${encodeURIComponent(
                `${process.env.NEXT_PUBLIC_APP_URL || ""}/article/${article.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                `${process.env.NEXT_PUBLIC_APP_URL || ""}/article/${article.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </Button>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <>
            <Separator className="my-12" />
            <section>
              <h2 className="text-2xl font-bold mb-6">More Stories</h2>
              <div className="space-y-6">
                {relatedArticles.map((relatedArticle) => (
                  <ArticleCard key={relatedArticle.id} article={relatedArticle} />
                ))}
              </div>
            </section>
          </>
        )}
      </article>
    </>
  );
}
