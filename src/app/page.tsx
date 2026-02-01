import { Suspense } from "react";
import { getLatestArticles } from "@/lib/supabase/client";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleSkeleton } from "@/components/ArticleSkeleton";
import { Separator } from "@/components/ui/separator";

// Revalidate every 5 minutes
export const revalidate = 300;

async function ArticlesFeed() {
  const articles = await getLatestArticles(20);

  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">No articles yet</h2>
        <p className="text-muted-foreground">
          Check back soon for the latest vibe coder news.
        </p>
      </div>
    );
  }

  // First article is featured
  const [featuredArticle, ...restArticles] = articles;

  return (
    <div className="space-y-8">
      {/* Featured Article */}
      {featuredArticle && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Latest
          </h2>
          <ArticleCard article={featuredArticle} featured />
        </section>
      )}

      <Separator />

      {/* Recent Articles Grid */}
      {restArticles.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Recent Stories
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ArticlesFeedSkeleton() {
  return (
    <div className="space-y-8">
      <section>
        <div className="h-4 w-16 bg-muted rounded mb-4" />
        <ArticleSkeleton featured />
      </section>
      <Separator />
      <section>
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ArticleSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          News for builders who{" "}
          <span className="text-primary">ship fast</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AI-curated daily digest of the most relevant news for vibe coders.
          Tools, workflows, and insights to help you build better.
        </p>
      </section>

      {/* Articles Feed */}
      <Suspense fallback={<ArticlesFeedSkeleton />}>
        <ArticlesFeed />
      </Suspense>
    </div>
  );
}
