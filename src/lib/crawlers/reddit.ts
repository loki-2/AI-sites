// ===========================================
// Reddit Crawler (using JSON endpoint)
// ===========================================

import type { RawItem } from "@/types";

// -------------------------------------------
// Reddit JSON API Types
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
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
    after: string | null;
  };
}

// -------------------------------------------
// Subreddits to crawl
// -------------------------------------------

const SUBREDDITS = [
  "vibecoding",
  // Add more relevant subreddits as needed
  // "LocalLLaMA",
  // "artificial",
  // "MachineLearning",
];

// -------------------------------------------
// Fetch posts from a subreddit using JSON endpoint
// -------------------------------------------

async function fetchSubreddit(
  subreddit: string,
  hoursBack: number,
  limit = 100
): Promise<RawItem[]> {
  const url = `https://old.reddit.com/r/${subreddit}/new.json?limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "VibeCodersNews/1.0 (Educational Bot)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Reddit:${subreddit}] HTTP error: ${response.status}`);
      return [];
    }

    const data: RedditListing = await response.json();
    const cutoffTime = Math.floor(Date.now() / 1000) - hoursBack * 60 * 60;

    const items: RawItem[] = [];

    for (const post of data.data.children) {
      const postData = post.data;

      // Skip old posts
      if (postData.created_utc < cutoffTime) continue;

      // Skip low-score posts
      if (minScore && postData.score < minScore) continue;

      // Determine the URL (self posts link to Reddit, others have external URLs)
      const postUrl = postData.is_self
        ? `https://reddit.com${postData.permalink}`
        : postData.url;

      // Create content summary
      const content = postData.selftext
        ? postData.selftext.slice(0, 500)
        : `Score: ${postData.score} | Comments: ${postData.num_comments}`;

      items.push({
        title: postData.title,
        url: postUrl,
        source: "reddit",
        content: content,
        score: postData.score,
        crawledAt: new Date(),
        author: postData.author,
        commentCount: postData.num_comments,
      });
    }

    console.log(`[Reddit:${subreddit}] Crawled ${items.length} posts`);
    return items;
  } catch (error) {
    console.error(`[Reddit:${subreddit}] Error:`, error);
    return [];
  }
}

// -------------------------------------------
// Crawl all configured subreddits
// -------------------------------------------

export async function crawlReddit(options: {
  hoursBack?: number;
  maxItemsPerSub?: number;
  minScore?: number;
} = {}): Promise<RawItem[]> {
  const { hoursBack = 24, maxItemsPerSub = 15, minScore = 10 } = options;

  const allItems: RawItem[] = [];

  // Crawl subreddits sequentially to respect rate limits
  for (const subreddit of SUBREDDITS) {
    const items = await fetchSubreddit(subreddit, hoursBack, maxItemsPerSub);
    allItems.push(...items);

    // Add delay between subreddit requests
    if (SUBREDDITS.indexOf(subreddit) < SUBREDDITS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`[Reddit] Total posts crawled: ${allItems.length}`);
  return allItems;
}

// -------------------------------------------
// Crawl specific subreddit
// -------------------------------------------

export async function crawlSubreddit(
  subreddit: string,
  hoursBack = 24
): Promise<RawItem[]> {
  return fetchSubreddit(subreddit, hoursBack);
}
