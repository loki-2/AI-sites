// ===========================================
// Aggregation Agent
// ===========================================
// Purpose: Deduplicate, extract insights, add initial tags

import { getLLM } from "@/lib/llm/provider";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RawItem, ProcessedItem } from "@/types";

// -------------------------------------------
// Aggregation Agent Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are a news aggregation specialist for VibeCoders - a community of builders who use AI tools to ship products fast.

Your job is to process raw news items and:
1. Extract the key insight - what actually matters for builders
2. Generate relevant tags for categorization
3. Assign a relevance score (0-100) based on how useful this is for vibe coders

Criteria for high relevance:
- New AI tools or updates (very high)
- Programming tips and tricks (high)
- Startup/indie maker news (high)
- AI model releases or improvements (high)
- Developer productivity tools (high)
- Industry news that affects builders (medium)
- General tech news without actionable value (low)

You must respond in valid JSON format only.`;

// -------------------------------------------
// Process a single item
// -------------------------------------------

async function processItem(item: RawItem): Promise<ProcessedItem | null> {
  const llm = getLLM({ temperature: 0.3 });

  const prompt = `Analyze this news item for vibe coders:

Title: ${item.title}
Source: ${item.source}
URL: ${item.url}
Content: ${item.content || "No content available"}
Score: ${item.score || "N/A"}

Respond with a JSON object (no markdown, just raw JSON):
{
  "summary": "2-3 sentence summary of what this is about",
  "whyItMatters": "1-2 sentences on why a builder should care",
  "tags": ["tag1", "tag2", "tag3"],
  "relevanceScore": 0-100
}`;

  try {
    const response = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(prompt),
    ]);

    const content = response.content as string;
    
    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1].split("```")[0].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      id: item.id || crypto.randomUUID(),
      title: item.title,
      originalUrl: item.url,
      summary: parsed.summary,
      tags: parsed.tags || [],
      relevanceScore: parsed.relevanceScore || 50,
      whyItMatters: parsed.whyItMatters,
      slackApproved: false,
      readyToPublish: false,
    };
  } catch (error) {
    console.error(`[Aggregation] Error processing item "${item.title}":`, error);
    return null;
  }
}

// -------------------------------------------
// Deduplicate items by similarity
// -------------------------------------------

function deduplicateItems(items: RawItem[]): RawItem[] {
  const seen = new Map<string, RawItem>();

  for (const item of items) {
    // Create a simple key from normalized title
    const key = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 50);

    // Keep the item with higher score if duplicate
    const existing = seen.get(key);
    if (!existing || (item.score || 0) > (existing.score || 0)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

// -------------------------------------------
// Main aggregation function
// -------------------------------------------

export async function aggregateItems(
  rawItems: RawItem[]
): Promise<ProcessedItem[]> {
  console.log(`[Aggregation] Processing ${rawItems.length} items...`);

  // First, deduplicate
  const uniqueItems = deduplicateItems(rawItems);
  console.log(`[Aggregation] After dedup: ${uniqueItems.length} unique items`);

  // Process items in batches to avoid rate limits
  const processedItems: ProcessedItem[] = [];
  const batchSize = 5;

  for (let i = 0; i < uniqueItems.length; i += batchSize) {
    const batch = uniqueItems.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(processItem));

    for (const result of results) {
      if (result) {
        processedItems.push(result);
      }
    }

    // Rate limit delay
    if (i + batchSize < uniqueItems.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`[Aggregation] Processed ${Math.min(i + batchSize, uniqueItems.length)}/${uniqueItems.length}`);
  }

  console.log(`[Aggregation] Successfully processed ${processedItems.length} items`);
  return processedItems;
}
