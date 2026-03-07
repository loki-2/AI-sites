'use client';

import React, { useState, useEffect } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleSkeleton } from "@/components/ArticleSkeleton";
import { Button } from "@/components/ui/button";
import type { PublishedArticle } from "@/types";
import useSWR from 'swr';

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

export function LearningTab() {
    const [activeCategory, setActiveCategory] = useState<Category>('all');
    const fetchArticles = async (url: string) => {
        const response = await fetch(url);
        return response.json() as Promise<PublishedArticle[]>;
    };

    const { data: articles = [], isLoading: loading } = useSWR('/api/articles', fetchArticles);

    // Filter articles based on category
    const filteredArticles = activeCategory === 'all'
        ? articles
        : articles.filter(article => article.category === activeCategory);

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 w-full">
            {/* Latest News Section */}
            <section className="mb-8">
                <div className="mb-8 pl-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tighter mb-4">
                        Techcrunch for Vibecoders
                    </h1>
                    <p className="text-lg font-medium text-muted-foreground mb-8">
                        Daily 2min digest articles to stay updated on things vibecoders care about.
                    </p>
                    {/* Category Filter Buttons */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant={activeCategory === 'all' ? 'default' : 'outline'}
                            onClick={() => setActiveCategory('all')}
                            className="font-semibold rounded-full"
                        >
                            All
                        </Button>
                        <Button
                            variant={activeCategory === 'news' ? 'default' : 'outline'}
                            onClick={() => setActiveCategory('news')}
                            className="font-semibold rounded-full"
                        >
                            News
                        </Button>
                        <Button
                            variant={activeCategory === 'actionable' ? 'default' : 'outline'}
                            onClick={() => setActiveCategory('actionable')}
                            className="font-semibold rounded-full"
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
