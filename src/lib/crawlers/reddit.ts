// ===========================================
// Reddit Crawler (Robust Implementation)
// ===========================================
// Industry-standard Reddit crawler with:
// - Config-driven subreddits
// - Proper rate limiting (Reddit is strict)
// - Retry logic with backoff
// - Relevance scoring integration

import type { RawItem } from '@/types';
import {
  getEnabledRedditSources,
  type RedditSourceConfig
} from './sources.config';
import { scoreRelevance, filterByRelevance, type ScoredItem } from './relevance';

// -------------------------------------------
// Configuration
// -------------------------------------------

const DEFAULT_TIMEOUT = 15000;  // 15 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_DELAY_MS = 2000;  // Reddit is strict about rate limits
const USER_AGENT = 'VibeCodersNews/2.0 (Educational Bot; +https://vibecoders.news)';

// -------------------------------------------
// Reddit API Types
// -------------------------------------------

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    selftext: string;
    score: number;
    created_utc: number;
    author: string;
    num_comments: number;
    permalink: string;
    is_self: boolean;
    subreddit: string;
    link_flair_text?: string;
    over_18: boolean;
    stickied: boolean;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
    after: string | null;
  };
}

// -------------------------------------------
// Types
// -------------------------------------------

export interface RedditCrawlResult {
  source: RedditSourceConfig;
  items: ScoredItem[];
  success: boolean;
  error?: string;
  duration: number;
}

export interface RedditCrawlStats {
  totalSubreddits: number;
  successfulSubreddits: number;
  failedSubreddits: string[];
  totalItems: number;
  filteredItems: number;
  duration: number;
}

// -------------------------------------------
// Retry Helper
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
        const waitTime = delay * Math.pow(2, attempt);
        console.log(`[Reddit] Retry ${attempt + 1}/${retries} in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// -------------------------------------------
// Fetch with Timeout
// -------------------------------------------

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// -------------------------------------------
// Crawl Single Subreddit
// -------------------------------------------

async function crawlSingleSubreddit(
  source: RedditSourceConfig,
  hoursBack: number
): Promise<RedditCrawlResult> {
  const startTime = Date.now();
  const url = `https://old.reddit.com/r/${source.subreddit}/new.json?limit=50`;

  try {
    console.log(`[Reddit:${source.subreddit}] Fetching...`);

    const response = await withRetry(async () => {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res;
    });

    const data: RedditListing = await response.json();
    const cutoffTime = Math.floor(Date.now() / 1000) - (hoursBack * 60 * 60);

    const items: RawItem[] = [];
    const minScore = source.minScore || 0;

    for (const post of data.data.children || []) {
      const postData = post.data;

      // Skip stickied posts (usually mod announcements)
      if (postData.stickied) continue;

      // Skip NSFW
      if (postData.over_18) continue;

      // Skip old posts
      if (postData.created_utc < cutoffTime) continue;

      // Skip low-score posts
      if (postData.score < minScore) continue;

      // Determine the URL
      const postUrl = postData.is_self
        ? `https://reddit.com${postData.permalink}`
        : postData.url;

      // Build content from selftext + metadata
      const content = postData.selftext
        ? postData.selftext.slice(0, 1000)
        : `Score: ${postData.score} | Comments: ${postData.num_comments}`;

      items.push({
        id: postData.id,
        title: postData.title,
        url: postUrl,
        source: `reddit_${source.subreddit}`,
        content: content,
        score: postData.score,
        crawledAt: new Date(),
        author: postData.author,
        commentCount: postData.num_comments,
      });
    }

    // Score all items for relevance
    const scoredItems = items.map(item =>
      scoreRelevance(item, source.category)
    );

    const duration = Date.now() - startTime;
    console.log(`[Reddit:${source.subreddit}] ✓ ${scoredItems.length} posts in ${duration}ms`);

    return {
      source,
      items: scoredItems,
      success: true,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Reddit:${source.subreddit}] ✗ Failed: ${errorMessage}`);

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
// Crawl All Enabled Subreddits
// -------------------------------------------

export async function crawlReddit(options: {
  hoursBack?: number;
  minRelevanceScore?: number;
  maxItemsPerSub?: number;
} = {}): Promise<{
  items: ScoredItem[];
  stats: RedditCrawlStats;
}> {
  const {
    hoursBack = 24,
    minRelevanceScore = 20, // Reddit posts often have inherent relevance from subreddit
    maxItemsPerSub = 15,
  } = options;

  const enabledSources = getEnabledRedditSources();

  if (enabledSources.length === 0) {
    console.log('[Reddit] No enabled subreddits configured');
    return {
      items: [],
      stats: {
        totalSubreddits: 0,
        successfulSubreddits: 0,
        failedSubreddits: [],
        totalItems: 0,
        filteredItems: 0,
        duration: 0,
      },
    };
  }

  console.log(`[Reddit] Crawling ${enabledSources.length} subreddit(s)...`);
  const startTime = Date.now();

  const results: RedditCrawlResult[] = [];

  // Crawl subreddits sequentially (Reddit rate limits are strict)
  for (const source of enabledSources) {
    const result = await crawlSingleSubreddit(source, hoursBack);
    results.push(result);

    // Rate limiting - Reddit requires at least 2s between requests
    if (enabledSources.indexOf(source) < enabledSources.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  }

  // Aggregate results
  const allItems: ScoredItem[] = [];
  const failedSubreddits: string[] = [];
  let totalRawItems = 0;

  for (const result of results) {
    if (result.success) {
      totalRawItems += result.items.length;

      // Filter by relevance (includes Tier 1 requirement and score threshold)
      const relevantItems = filterByRelevance(result.items, {
        minScore: minRelevanceScore,
        maxItems: maxItemsPerSub,
        requireTier1Match: true,
      });

      allItems.push(...relevantItems);
    } else {
      failedSubreddits.push(result.source.subreddit);
    }
  }

  const duration = Date.now() - startTime;

  const stats: RedditCrawlStats = {
    totalSubreddits: enabledSources.length,
    successfulSubreddits: results.filter(r => r.success).length,
    failedSubreddits,
    totalItems: totalRawItems,
    filteredItems: allItems.length,
    duration,
  };

  console.log(`[Reddit] Complete: ${allItems.length}/${totalRawItems} items passed relevance filter (${duration}ms)`);

  return { items: allItems, stats };
}

// -------------------------------------------
// Crawl Specific Subreddit
// -------------------------------------------

export async function crawlSubreddit(
  subreddit: string,
  hoursBack: number = 24
): Promise<RedditCrawlResult> {
  const sources = getEnabledRedditSources();
  const source = sources.find(s => s.subreddit === subreddit);

  if (!source) {
    // Create ad-hoc config for unlisted subreddit
    const adhocSource: RedditSourceConfig = {
      id: subreddit,
      subreddit,
      enabled: true,
      category: 'dev_workflow',
      minScore: 5,
    };
    return crawlSingleSubreddit(adhocSource, hoursBack);
  }

  return crawlSingleSubreddit(source, hoursBack);
}
