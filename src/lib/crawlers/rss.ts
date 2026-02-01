// ===========================================
// RSS Feed Crawler
// ===========================================

import Parser from "rss-parser";
import type { RawItem, NewsSource } from "@/types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "VibeCodersNews/1.0 (RSS Reader)",
  },
});

// -------------------------------------------
// RSS Feed Sources Configuration
// -------------------------------------------

interface RSSSource {
  name: NewsSource;
  url: string;
  enabled: boolean;
}

const RSS_SOURCES: RSSSource[] = [
  {
    name: "techcrunch",
    url: "https://techcrunch.com/feed/",
    enabled: true,
  },
  {
    name: "openai_blog",
    url: "https://openai.com/blog/rss.xml",
    enabled: true,
  },
  {
    name: "anthropic_blog",
    url: "https://www.anthropic.com/rss.xml",
    enabled: true,
  },
  // Note: Some blogs might not have RSS, will need to check
];

// -------------------------------------------
// Crawl a single RSS feed
// -------------------------------------------

async function crawlFeed(source: RSSSource, hoursBack: number): Promise<RawItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    const items: RawItem[] = [];

    for (const item of feed.items) {
      // Check publication date
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      if (pubDate < cutoffTime) continue;

      // Skip if no link
      if (!item.link) continue;

      // Filter for AI/dev/tool relevance for TechCrunch (it's general news)
      if (source.name === "techcrunch") {
        const relevantKeywords = [
          "ai", "artificial intelligence", "gpt", "llm", "machine learning",
          "openai", "anthropic", "google", "microsoft", "startup",
          "developer", "api", "code", "programming", "software",
          "saas", "tool", "automation", "agent", "chatbot"
        ];

        const titleLower = (item.title || "").toLowerCase();
        const contentLower = (item.contentSnippet || "").toLowerCase();
        const isRelevant = relevantKeywords.some(
          keyword => titleLower.includes(keyword) || contentLower.includes(keyword)
        );

        if (!isRelevant) continue;
      }

      items.push({
        title: item.title || "Untitled",
        url: item.link,
        source: source.name,
        content: item.contentSnippet || item.content || "",
        crawledAt: new Date(),
        score: 0, // RSS feeds don't have scores
      });
    }

    console.log(`[RSS:${source.name}] Crawled ${items.length} items`);
    return items;
  } catch (error) {
    console.error(`[RSS:${source.name}] Error:`, error);
    return [];
  }
}

// -------------------------------------------
// Crawl all RSS feeds
// -------------------------------------------

export async function crawlAllRSSFeeds(options: {
  hoursBack?: number;
  maxItemsPerFeed?: number;
} = {}): Promise<RawItem[]> {
  const { hoursBack = 24, maxItemsPerFeed = 15 } = options;

  const enabledSources = RSS_SOURCES.filter((s) => s.enabled);
  const allItems: RawItem[] = [];

  // Crawl feeds in parallel
  const results = await Promise.all(
    enabledSources.map((source) => crawlFeed(source, hoursBack))
  );

  for (const feedItems of results) {
    allItems.push(...feedItems.slice(0, maxItemsPerFeed));
  }

  console.log(`[RSS] Total items crawled: ${allItems.length}`);
  return allItems;
}

// -------------------------------------------
// Crawl specific RSS feed by source name
// -------------------------------------------

export async function crawlRSSFeed(
  sourceName: NewsSource,
  hoursBack = 24
): Promise<RawItem[]> {
  const source = RSS_SOURCES.find((s) => s.name === sourceName);
  if (!source) {
    console.error(`[RSS] Unknown source: ${sourceName}`);
    return [];
  }

  return crawlFeed(source, hoursBack);
}
