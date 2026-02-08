"use client";

import Link from "next/link";
import Image from "next/image";
import type { PublishedArticle } from "@/types";

interface ArticleCardProps {
  article: PublishedArticle;
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
}

// Map category to display name
function getCategoryDisplay(category?: string): string {
  if (category === "actionable") return "LEARNING";
  return "NEWS";
}

export function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = getTimeAgo(new Date(article.publishedAt));
  const categoryDisplay = getCategoryDisplay(article.category);
  const coverImage = article.coverImage || '/article-placeholder.png';

  return (
    <article className="border-b border-border pb-6 last:border-b-0">
      <div className="flex gap-4">
        {/* Cover Image */}
        <div className="relative w-32 h-24 flex-shrink-0 bg-muted overflow-hidden">
          <Image
            src={coverImage}
            alt={article.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <div className="mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {categoryDisplay}
            </span>
          </div>

          {/* Title */}
          <Link href={`/article/${article.slug}`}>
            <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2 hover:text-primary transition-colors cursor-pointer">
              {article.title}
            </h2>
          </Link>

          {/* Author and Time */}
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">Abhishek</span>
            <span className="mx-2">·</span>
            <span className="font-semibold">{timeAgo}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
