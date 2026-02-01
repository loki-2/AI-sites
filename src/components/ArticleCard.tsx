"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PublishedArticle } from "@/types";

interface ArticleCardProps {
  article: PublishedArticle;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  if (featured) {
    return (
      <Card className="border-2 border-primary/20 bg-card hover:border-primary/40 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {article.source && (
              <Badge variant="secondary" className="text-xs font-medium">
                {article.source}
              </Badge>
            )}
            <span>{formattedDate}</span>
          </div>
          <Link href={`/article/${article.slug}`}>
            <h2 className="text-2xl font-bold leading-tight hover:text-primary transition-colors">
              {article.title}
            </h2>
          </Link>
        </CardHeader>
        <CardContent>
          {article.summary && (
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {article.summary}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {article.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <Link href={`/article/${article.slug}`}>
              <Button variant="default" size="sm">
                Read More
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border hover:border-primary/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {article.source && (
            <Badge variant="secondary" className="text-xs font-medium">
              {article.source}
            </Badge>
          )}
          <span>{formattedDate}</span>
        </div>
        <Link href={`/article/${article.slug}`}>
          <h3 className="text-lg font-semibold leading-tight hover:text-primary transition-colors">
            {article.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {article.summary && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {article.summary}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {article.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <Link href={`/article/${article.slug}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              Read →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
