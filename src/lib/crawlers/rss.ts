// ===========================================
// RSS Feed Crawler (Robust Implementation)
// ===========================================
// Industry-standard RSS crawler with:
// - Config-driven sources
// - Retry logic with exponential backoff
// - Proper timeout handling
// - Error isolation (one feed failing doesn't break others)

import Parser from 'rss-parser';
import type { RawItem } from '@/types';
import {
  getEnabledRSSSources,
  type RSSSourceConfig,
  type ContentCategory
} from './sources.config';
import { scoreRelevance, filterByRelevance, type ScoredItem } from './relevance';

// -------------------------------------------
// Configuration
// -------------------------------------------

const DEFAULT_TIMEOUT = 15000;  // 15 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 500;  // Delay between feeds

// Parser instance with custom config
const parser = new Parser({
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'User-Agent': 'VibeCodersNews/2.0 (RSS Reader; +https://vibecoders.news)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['dc:creator', 'creator'],
    ],
  },
});

// -------------------------------------------
// Types
// -------------------------------------------

export interface RSSCrawlResult {
  source: RSSSourceConfig;
  items: ScoredItem[];
  success: boolean;
  error?: string;
  duration: number;
}

export interface RSSCrawlStats {
  totalSources: number;
  successfulSources: number;
  failedSources: string[];
  totalItems: number;
  filteredItems: number;
  duration: number;
}

// -------------------------------------------
// Retry Helper with Exponential Backoff
// -------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        console.log(`[RSS] Retry ${attempt + 1}/${retries} in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// -------------------------------------------
// Crawl Single Feed
// -------------------------------------------

async function crawlSingleFeed(
  source: RSSSourceConfig,
  hoursBack: number
): Promise<RSSCrawlResult> {
  const startTime = Date.now();

  try {
    console.log(`[RSS:${source.id}] Fetching ${source.url}...`);

    // Fetch with retry logic
    const feed = await withRetry(() => parser.parseURL(source.url));

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    const items: RawItem[] = [];

    for (const entry of feed.items || []) {
      // Skip if no link
      if (!entry.link) continue;

      // Parse publication date
      const pubDate = entry.pubDate
        ? new Date(entry.pubDate)
        : entry.isoDate
          ? new Date(entry.isoDate)
          : new Date();

      // Skip old items
      if (pubDate < cutoffTime) continue;

      // Extract content (prefer contentSnippet, fallback to content)
      const content = entry.contentSnippet
        || entry.content
        || entry.summary
        || '';

      items.push({
        title: entry.title || 'Untitled',
        url: entry.link,
        source: source.id,
        content: content.slice(0, 1000), // Limit content length
        crawledAt: new Date(),
        score: 0,
        author: entry.creator || (entry as any).author,
      });
    }

    // Score all items for relevance
    const scoredItems = items.map(item =>
      scoreRelevance(item, source.category)
    );

    const duration = Date.now() - startTime;
    console.log(`[RSS:${source.id}] ✓ ${scoredItems.length} items in ${duration}ms`);

    return {
      source,
      items: scoredItems,
      success: true,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[RSS:${source.id}] ✗ Failed: ${errorMessage}`);

    return {
      source,
      items: [],
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

// -------------------------------------------
// Crawl All Enabled RSS Feeds
// -------------------------------------------

export async function crawlAllRSSFeeds(options: {
  hoursBack?: number;
  minRelevanceScore?: number;
  maxItemsPerFeed?: number;
} = {}): Promise<{
  items: ScoredItem[];
  stats: RSSCrawlStats;
}> {
  const {
    hoursBack = 24,
    minRelevanceScore = 30,
    maxItemsPerFeed = 20,
  } = options;

  const enabledSources = getEnabledRSSSources();

  if (enabledSources.length === 0) {
    console.log('[RSS] No enabled sources configured');
    return {
      items: [],
      stats: {
        totalSources: 0,
        successfulSources: 0,
        failedSources: [],
        totalItems: 0,
        filteredItems: 0,
        duration: 0,
      },
    };
  }

  console.log(`[RSS] Crawling ${enabledSources.length} source(s)...`);
  const startTime = Date.now();

  const results: RSSCrawlResult[] = [];

  // Crawl feeds sequentially to respect rate limits
  for (const source of enabledSources) {
    const result = await crawlSingleFeed(source, hoursBack);
    results.push(result);

    // Rate limiting delay between feeds
    if (enabledSources.indexOf(source) < enabledSources.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  }

  // Aggregate results
  const allItems: ScoredItem[] = [];
  const failedSources: string[] = [];
  let totalRawItems = 0;

  for (const result of results) {
    if (result.success) {
      totalRawItems += result.items.length;

      // Filter by relevance (includes Tier 1 requirement and score threshold)
      const relevantItems = filterByRelevance(result.items, {
        minScore: minRelevanceScore,
        maxItems: maxItemsPerFeed,
        requireTier1Match: true,
      });

      allItems.push(...relevantItems);
    } else {
      failedSources.push(result.source.id);
    }
  }

  const duration = Date.now() - startTime;

  const stats: RSSCrawlStats = {
    totalSources: enabledSources.length,
    successfulSources: results.filter(r => r.success).length,
    failedSources,
    totalItems: totalRawItems,
    filteredItems: allItems.length,
    duration,
  };

  console.log(`[RSS] Complete: ${allItems.length}/${totalRawItems} items passed relevance filter (${duration}ms)`);

  return { items: allItems, stats };
}

// -------------------------------------------
// Crawl Specific Feed by ID
// -------------------------------------------

export async function crawlRSSFeedById(
  sourceId: string,
  hoursBack: number = 24
): Promise<RSSCrawlResult> {
  const sources = getEnabledRSSSources();
  const source = sources.find(s => s.id === sourceId);

  if (!source) {
    return {
      source: { id: sourceId, name: sourceId, url: '', enabled: false, category: 'ai_tools' },
      items: [],
      success: false,
      error: `Source not found or not enabled: ${sourceId}`,
      duration: 0,
    };
  }

  return crawlSingleFeed(source, hoursBack);
}
