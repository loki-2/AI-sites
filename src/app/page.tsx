import { Suspense } from "react";
import { getLatestArticles } from "@/lib/supabase/client";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleSkeleton } from "@/components/ArticleSkeleton";

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

  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

function ArticlesFeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <ArticleSkeleton key={i} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Latest News Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tighter">
            Techcrunch for Vibecoders
          </h1>
          {/* <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full hover:border-primary transition-colors text-sm"
          >
            See More
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a> */}
        </div>

        {/* Articles Feed */}
        <Suspense fallback={<ArticlesFeedSkeleton />}>
          <ArticlesFeed />
        </Suspense>
      </section>
    </div>
  );
}
