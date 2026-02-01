// ===========================================
// Sorting & Filtering Agent
// ===========================================
// Purpose: Score items and return top 50

import { getLLM } from "@/lib/llm/provider";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ProcessedItem } from "@/types";

// -------------------------------------------
// Sorting Agent Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are a content curator for VibeCoders - builders who use AI to ship fast.

Your job is to score news items on 4 criteria (each 0-25 points, total 0-100):

1. RELEVANCE TO VIBE CODING (0-25)
   - 25: Directly about AI-assisted coding, Cursor, Copilot, or similar tools
   - 20: About AI tools for builders/creators
   - 15: About AI/LLM developments useful for coding
   - 10: General developer tools/productivity
   - 5: Tangentially related tech news
   - 0: Not relevant

2. NOVELTY (0-25)
   - 25: Breaking news, brand new tool/feature
   - 20: Recent development (< 24 hours)
   - 15: Fresh perspective on known topic
   - 10: Useful but not new
   - 5: Rehashed content
   - 0: Old news

3. ACTIONABILITY (0-25)
   - 25: Reader can immediately use/apply this
   - 20: Clear next steps or tools to try
   - 15: Provides useful knowledge
   - 10: Interesting but not actionable
   - 5: Just news/information
   - 0: No practical value

4. TOOL/WORKFLOW FOCUS (0-25)
   - 25: Introduces new tool or workflow
   - 20: Tutorial or how-to content
   - 15: Tool comparison or review
   - 10: Discusses tools in context
   - 5: Mentions tools
   - 0: No tool focus

Respond with a JSON array only.`;

// -------------------------------------------
// Score a batch of items
// -------------------------------------------

async function scoreBatch(items: ProcessedItem[]): Promise<ProcessedItem[]> {
  const llm = getLLM({ temperature: 0.2 });

  const itemsSummary = items
    .map((item, idx) => `[${idx}] "${item.title}" - ${item.summary}`)
    .join("\n");

  const prompt = `Score these ${items.length} news items for vibe coders.

Items to score:
${itemsSummary}

Respond with a JSON array (no markdown, just raw JSON):
[
  { "index": 0, "relevance": 0-25, "novelty": 0-25, "actionability": 0-25, "toolFocus": 0-25, "total": 0-100 },
  ...
]`;

  try {
    const response = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(prompt),
    ]);

    const content = response.content as string;

    // Parse JSON from response
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1].split("```")[0].trim();
    }

    const scores = JSON.parse(jsonStr);

    // Update items with new scores
    return items.map((item, idx) => {
      const scoreData = scores.find((s: any) => s.index === idx);
      if (scoreData) {
        return {
          ...item,
          relevanceScore: scoreData.total,
        };
      }
      return item;
    });
  } catch (error) {
    console.error("[Sorting] Error scoring batch:", error);
    // Return items with original scores if scoring fails
    return items;
  }
}

// -------------------------------------------
// Main sorting function
// -------------------------------------------

export async function sortAndFilterItems(
  items: ProcessedItem[],
  topN = 50
): Promise<ProcessedItem[]> {
  console.log(`[Sorting] Sorting ${items.length} items, selecting top ${topN}...`);

  // First, do a quick filter based on initial relevance scores
  // Only send items with decent potential for detailed scoring
  const candidates = items.filter((item) => item.relevanceScore >= 30);
  console.log(`[Sorting] ${candidates.length} candidates after initial filter`);

  // Score items in batches
  const scoredItems: ProcessedItem[] = [];
  const batchSize = 10;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const scored = await scoreBatch(batch);
    scoredItems.push(...scored);

    // Rate limit delay
    if (i + batchSize < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[Sorting] Scored ${Math.min(i + batchSize, candidates.length)}/${candidates.length}`);
  }

  // Sort by relevance score (descending)
  scoredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return top N
  const topItems = scoredItems.slice(0, topN);
  console.log(`[Sorting] Selected top ${topItems.length} items`);

  return topItems;
}
