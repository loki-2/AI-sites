'use client';

import React, { useState, useEffect } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleSkeleton } from "@/components/ArticleSkeleton";
import { Button } from "@/components/ui/button";
import type { PublishedArticle } from "@/types";

type Category = 'all' | 'news' | 'actionable';

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
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles on mount
  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  // Filter articles based on category
  const filteredArticles = activeCategory === 'all'
    ? articles
    : articles.filter(article => article.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Latest News Section */}
      <section className="mb-8">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tighter mb-6">
            Techcrunch for Vibecoders
          </h1>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveCategory('all')}
              className="font-semibold"
            >
              All
            </Button>
            <Button
              variant={activeCategory === 'news' ? 'default' : 'outline'}
              onClick={() => setActiveCategory('news')}
              className="font-semibold"
            >
              News
            </Button>
            <Button
              variant={activeCategory === 'actionable' ? 'default' : 'outline'}
              onClick={() => setActiveCategory('actionable')}
              className="font-semibold"
            >
              Learning
            </Button>
          </div>
        </div>

        {/* Articles Feed */}
        {loading ? (
          <ArticlesFeedSkeleton />
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">No articles yet</h2>
            <p className="text-muted-foreground">
              Check back soon for the latest vibe coder news.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
