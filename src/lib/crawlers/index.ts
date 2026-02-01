// ===========================================
// Unified Crawler Interface
// ===========================================

import { crawlHackerNews } from "./hackernews";
import { crawlAllRSSFeeds } from "./rss";
import { crawlReddit } from "./reddit";
import type { RawItem } from "@/types";

export { crawlHackerNews } from "./hackernews";
export { crawlAllRSSFeeds, crawlRSSFeed } from "./rss";
export { crawlReddit, crawlSubreddit } from "./reddit";

// -------------------------------------------
// Crawl all sources
// -------------------------------------------

export async function crawlAllSources(options: {
  hoursBack?: number;
} = {}): Promise<RawItem[]> {
  const { hoursBack = 24 } = options;

  console.log(`[Crawler] Starting crawl for last ${hoursBack} hours...`);

  // Run all crawlers in parallel
  const [hnItems, rssItems, redditItems] = await Promise.all([
    crawlHackerNews({ hoursBack, minScore: 30 }),
    crawlAllRSSFeeds({ hoursBack }),
    crawlReddit({ hoursBack }),
  ]);

  const allItems = [...hnItems, ...rssItems, ...redditItems];

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniqueItems = allItems.filter((item) => {
    const normalized = normalizeUrl(item.url);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  console.log(`[Crawler] Total unique items: ${uniqueItems.length} (from ${allItems.length})`);
  return uniqueItems;
}

// -------------------------------------------
// Normalize URL for deduplication
// -------------------------------------------

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slashes, www prefix, and query params for comparison
    let normalized = parsed.hostname.replace(/^www\./, "") + parsed.pathname;
    normalized = normalized.replace(/\/$/, "");
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
