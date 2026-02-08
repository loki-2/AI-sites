"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ArticleSkeleton() {
  return (
    <article className="border-b border-border pb-6">
      <div className="flex gap-4">
        {/* Thumbnail skeleton */}
        <div className="hidden sm:block w-32 h-24 bg-muted flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Category skeleton */}
          <div className="mb-2">
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Title skeleton */}
          <Skeleton className="h-7 w-full mb-2" />
          <Skeleton className="h-7 w-3/4 mb-3" />

          {/* Author and time skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </article>
  );
}
