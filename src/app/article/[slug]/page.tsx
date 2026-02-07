import { notFound } from "next/navigation";
import Link from "next/link";
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
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary || article.content.slice(0, 160),
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
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibecoders.news";

  // Generate schema markup for SEO
  const articleSchema = generateArticleSchema({
    headline: article.title,
    description: article.summary || article.content.slice(0, 160),
    datePublished: article.publishedAt.toISOString(),
    image: `${baseUrl}/og-image.png`,
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
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          ← Back to all articles
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {article.source && (
              <Badge variant="secondary" className="text-xs font-medium">
                {article.source}
              </Badge>
            )}
            <span>{formattedDate}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {article.summary}
            </p>
          )}

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <Separator className="my-8" />

        {/* Article Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {article.content.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-4 text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Source Link */}
        {article.originalUrl && (
          <div className="mt-8 p-4 bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Original Source</p>
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {article.originalUrl}
            </a>
          </div>
        )}

        {/* Share Actions */}
        <div className="mt-8 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Share:</span>
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
              <h2 className="text-xl font-semibold mb-6">More Stories</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {relatedArticles.map((relatedArticle) => (
                  <ArticleCard key={relatedArticle.id} article={relatedArticle} />
                ))}
              </div>
            </section>
          </>
        )}
      </article>
    </>
}
