// ===========================================
// HackerNews Crawler
// ===========================================

import type { RawItem } from "@/types";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
  by: string;
  descendants?: number;
  type: string;
}

// -------------------------------------------
// Fetch top stories from HackerNews
// -------------------------------------------

export async function crawlHackerNews(options: {
  maxItems?: number;
  minScore?: number;
  hoursBack?: number;
} = {}): Promise<RawItem[]> {
  const { maxItems = 20, minScore = 100, hoursBack = 24 } = options;

  try {
    // Get top story IDs
    const topStoriesResponse = await fetch(`${HN_API_BASE}/topstories.json`);
    const topStoryIds: number[] = await topStoriesResponse.json();

    // Also get new stories for fresh content
    const newStoriesResponse = await fetch(`${HN_API_BASE}/newstories.json`);
    const newStoryIds: number[] = await newStoriesResponse.json();

    // Combine and dedupe
    const allStoryIds = [...new Set([...topStoryIds.slice(0, 200), ...newStoryIds.slice(0, 100)])];

    // Calculate cutoff time
    const cutoffTime = Math.floor(Date.now() / 1000) - hoursBack * 60 * 60;

    // Fetch stories in parallel batches
    const stories: RawItem[] = [];
    const batchSize = 20;

    for (let i = 0; i < allStoryIds.length && stories.length < maxItems; i += batchSize) {
      const batch = allStoryIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (id) => {
        try {
          const response = await fetch(`${HN_API_BASE}/item/${id}.json`);
          const story: HNStory = await response.json();
          return story;
        } catch {
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const story of batchResults) {
        if (!story || story.type !== "story") continue;
        if (!story.url) continue; // Skip Ask HN, Show HN without links
        if (story.time < cutoffTime) continue; // Skip old stories
        if (story.score < minScore) continue; // Skip low-score stories

        // Filter for vibe coding relevance (AI, tools, programming)
        const relevantKeywords = [
          "ai", "gpt", "llm", "claude", "gemini", "openai", "anthropic",
          "cursor", "copilot", "code", "programming", "developer", "dev",
          "typescript", "javascript", "python", "rust", "api", "tool",
          "startup", "indie", "saas", "launch", "product", "build",
          "agent", "automation", "workflow", "no-code", "low-code"
        ];

        const titleLower = story.title.toLowerCase();
        const isRelevant = relevantKeywords.some(keyword => titleLower.includes(keyword));

        if (!isRelevant) continue;

        stories.push({
          title: story.title,
          url: story.url,
          source: "hackernews",
          content: `HN Score: ${story.score} | Comments: ${story.descendants || 0} | By: ${story.by}`,
          score: story.score,
          crawledAt: new Date(),
          author: story.by,
          commentCount: story.descendants,
        });

        if (stories.length >= maxItems) break;
      }
    }

    console.log(`[HackerNews] Crawled ${stories.length} relevant stories`);
    return stories;
  } catch (error) {
    console.error("[HackerNews] Crawl error:", error);
    return [];
  }
}
