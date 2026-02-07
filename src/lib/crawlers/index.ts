// ===========================================
// Unified Crawler Engine
// ===========================================
// Central crawler orchestration with:
// - Config-driven source management
// - Unified relevance scoring
// - Comprehensive stats and logging
// - Easy extensibility

import type { RawItem } from '@/types';
import { crawlAllRSSFeeds, type RSSCrawlStats } from './rss';
import { crawlReddit, type RedditCrawlStats } from './reddit';
import {
  getSourcesStats,
  isAnyCrawlerEnabled,
  getEnabledRSSSources,
  getEnabledRedditSources,
} from './sources.config';
import { type ScoredItem, filterByRelevance } from './relevance';

// -------------------------------------------
// Re-exports for convenience
// -------------------------------------------

export { crawlAllRSSFeeds, crawlRSSFeedById } from './rss';
export { crawlReddit, crawlSubreddit } from './reddit';
export {
  SOURCES_CONFIG,
  getSourcesStats,
  getEnabledRSSSources,
  getEnabledRedditSources,
} from './sources.config';
export {
  scoreRelevance,
  filterByRelevance,
  getKeywordStats,
  type ScoredItem,
} from './relevance';

// -------------------------------------------
// Types
// -------------------------------------------

export interface CrawlResult {
  items: ScoredItem[];
  stats: CrawlStats;
}

export interface CrawlStats {
  sources: {
    rss: RSSCrawlStats | null;
    reddit: RedditCrawlStats | null;
  };
  totals: {
    sourcesEnabled: number;
    sourcesSuccessful: number;
    sourcesFailed: number;
    rawItems: number;
    filteredItems: number;
    finalItems: number;
  };
  timing: {
    startTime: Date;
    endTime: Date;
    durationMs: number;
  };
}

export interface CrawlOptions {
  hoursBack?: number;           // How far back to look (default: 24)
  minRelevanceScore?: number;   // Minimum score to include (default: 30)
  maxItemsPerSource?: number;   // Max items per source (default: 20)
  maxTotalItems?: number;       // Max total items to return (default: 50)
  deduplicateUrls?: boolean;    // Remove duplicate URLs (default: true)
}

// -------------------------------------------
// Main Crawl Function
// -------------------------------------------

export async function crawlAllSources(
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const {
    hoursBack = 24,
    minRelevanceScore = 30,
    maxItemsPerSource = 20,
    maxTotalItems = 50,
    deduplicateUrls = true,
  } = options;

  const startTime = new Date();
  console.log(`\n[Crawler] ========================================`);
  console.log(`[Crawler] Starting crawl (last ${hoursBack}h, min score: ${minRelevanceScore})`);

  // Check if any sources are enabled
  if (!isAnyCrawlerEnabled()) {
    console.log('[Crawler] No sources enabled! Check sources.config.ts');
    return {
      items: [],
      stats: createEmptyStats(startTime),
    };
  }

  // Log enabled sources
  const sourceStats = getSourcesStats();
  console.log(`[Crawler] Enabled: ${sourceStats.rss.enabled} RSS, ${sourceStats.reddit.enabled} Reddit`);

  // Run crawlers in parallel
  const [rssResult, redditResult] = await Promise.all([
    getEnabledRSSSources().length > 0
      ? crawlAllRSSFeeds({ hoursBack, minRelevanceScore, maxItemsPerFeed: maxItemsPerSource })
      : Promise.resolve(null),
    getEnabledRedditSources().length > 0
      ? crawlReddit({ hoursBack, minRelevanceScore, maxItemsPerSub: maxItemsPerSource })
      : Promise.resolve(null),
  ]);

  // Combine all items
  const allItems: ScoredItem[] = [
    ...(rssResult?.items || []),
    ...(redditResult?.items || []),
  ];

  console.log(`[Crawler] Raw items collected: ${allItems.length}`);

  // Deduplicate by URL
  let processedItems = allItems;
  if (deduplicateUrls) {
    processedItems = deduplicateByUrl(allItems);
    console.log(`[Crawler] After dedup: ${processedItems.length} items`);
  }

  // Sort by relevance score
  processedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Limit total items
  if (processedItems.length > maxTotalItems) {
    processedItems = processedItems.slice(0, maxTotalItems);
    console.log(`[Crawler] Limited to top ${maxTotalItems} items`);
  }

  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();

  // Build stats
  const stats: CrawlStats = {
    sources: {
      rss: rssResult?.stats || null,
      reddit: redditResult?.stats || null,
    },
    totals: {
      sourcesEnabled: (sourceStats.rss.enabled || 0) + (sourceStats.reddit.enabled || 0),
      sourcesSuccessful:
        (rssResult?.stats.successfulSources || 0) +
        (redditResult?.stats.successfulSubreddits || 0),
      sourcesFailed:
        (rssResult?.stats.failedSources.length || 0) +
        (redditResult?.stats.failedSubreddits.length || 0),
      rawItems:
        (rssResult?.stats.totalItems || 0) +
        (redditResult?.stats.totalItems || 0),
      filteredItems:
        (rssResult?.stats.filteredItems || 0) +
        (redditResult?.stats.filteredItems || 0),
      finalItems: processedItems.length,
    },
    timing: {
      startTime,
      endTime,
      durationMs,
    },
  };

  console.log(`[Crawler] ========================================`);
  console.log(`[Crawler] Complete: ${processedItems.length} items in ${durationMs}ms`);
  console.log(`[Crawler] Top scores: ${processedItems.slice(0, 3).map(i => i.relevanceScore).join(', ')}`);
  console.log(`[Crawler] ========================================\n`);

  return { items: processedItems, stats };
}

// -------------------------------------------
// URL Deduplication
// -------------------------------------------

function deduplicateByUrl(items: ScoredItem[]): ScoredItem[] {
  const seen = new Set<string>();
  const unique: ScoredItem[] = [];

  for (const item of items) {
    const normalized = normalizeUrl(item.url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(item);
    }
  }

  return unique;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove www, trailing slashes, and common tracking params
    let normalized = parsed.hostname.replace(/^www\./, '') + parsed.pathname;
    normalized = normalized.replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// -------------------------------------------
// Helper: Create Empty Stats
// -------------------------------------------

function createEmptyStats(startTime: Date): CrawlStats {
  const endTime = new Date();
  return {
    sources: { rss: null, reddit: null },
    totals: {
      sourcesEnabled: 0,
      sourcesSuccessful: 0,
      sourcesFailed: 0,
      rawItems: 0,
      filteredItems: 0,
      finalItems: 0,
    },
    timing: {
      startTime,
      endTime,
      durationMs: endTime.getTime() - startTime.getTime(),
    },
  };
}

// -------------------------------------------
// Quick Test Function
// -------------------------------------------

export async function testCrawler(): Promise<void> {
  console.log('\n=== CRAWLER TEST ===\n');

  const sourceStats = getSourcesStats();
  console.log('Configured sources:', JSON.stringify(sourceStats, null, 2));

  const result = await crawlAllSources({
    hoursBack: 48, // Look back further for testing
    minRelevanceScore: 20,
    maxTotalItems: 10,
  });

  console.log('\n=== RESULTS ===\n');
  console.log(`Total items: ${result.items.length}`);

  for (const item of result.items) {
    console.log(`\n[${item.relevanceScore}] ${item.title}`);
    console.log(`  Source: ${item.source}`);
    console.log(`  URL: ${item.url}`);
    if (item.relevanceDetails) {
      console.log(`  Matches: T1=${item.relevanceDetails.tier1Matches.length}, T2=${item.relevanceDetails.tier2Matches.length}, T3=${item.relevanceDetails.tier3Matches.length}`);
    }
  }

  console.log('\n=== STATS ===\n');
  console.log(JSON.stringify(result.stats.totals, null, 2));
}
