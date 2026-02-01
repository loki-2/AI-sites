// ===========================================
// Headline Writer Agent
// ===========================================
// Purpose: Create catchy, builder-focused headlines from raw items

import { callGeminiJSON } from "@/lib/llm/gemini-direct";
import type { RawItem, ProcessedItem } from "@/types";

// -------------------------------------------
// Headline Writer Agent Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are a headline writer for VibeCoders - builders who use AI tools to ship fast.

Your job is to transform raw news items into compelling headlines that make builders want to click.

For each item, create:
1. A catchy headline (max 80 chars) - specific, actionable, no clickbait
2. A one-line summary (1-2 sentences max)
3. Why it matters for builders (1 sentence)
4. 2-3 relevant tags

Good headlines:
✓ "Claude now supports 1M token context - build complex apps in one prompt"
✓ "New cursor feature auto-fixes linter errors in real-time"
✓ "Show HN: I built a SaaS in 48 hours using Claude Code"

Bad headlines:
✗ "Major AI Update Released" (too vague)
✗ "You Won't Believe What This New Tool Does!" (clickbait)
✗ "Company Announces Product Changes" (boring)

Focus on: new tools, AI updates, coding workflows, indie maker wins, practical tutorials

Respond with JSON only.`;

// -------------------------------------------
// Process a single item
// -------------------------------------------

interface HeadlineResult {
  headline: string;
  summary: string;
  whyItMatters: string;
  tags: string[];
  relevanceScore: number;
}

async function processItem(item: RawItem): Promise<ProcessedItem | null> {
  const prompt = `Transform this news item into a compelling headline for vibe coders (builders who use AI to ship fast).

Original Title: ${item.title}
Source: ${item.source}

Respond with ONLY valid JSON (no markdown):
{"headline": "Catchy headline max 80 chars", "summary": "One line summary", "whyItMatters": "Why builders care", "tags": ["tag1", "tag2"], "relevanceScore": 70}`;

  try {
    const result = await callGeminiJSON<HeadlineResult>(prompt, SYSTEM_PROMPT, {
      temperature: 0.5,
      maxOutputTokens: 1024,
    });

    return {
      id: item.id || crypto.randomUUID(),
      title: result.headline,
      originalUrl: item.url,
      summary: result.summary,
      tags: result.tags || [],
      relevanceScore: result.relevanceScore || 50,
      whyItMatters: result.whyItMatters,
      slackApproved: false,
      readyToPublish: false,
    };
  } catch (error) {
    console.error(`[Headline Writer] Error processing "${item.title}":`, error);
    return null;
  }
}

// -------------------------------------------
// Process multiple items one by one
// -------------------------------------------

export async function generateHeadlines(
  rawItems: RawItem[]
): Promise<ProcessedItem[]> {
  console.log(`[Headline Writer] Processing ${rawItems.length} items one by one...`);

  const processedItems: ProcessedItem[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const result = await processItem(rawItems[i]);
    if (result) {
      processedItems.push(result);
    }

    // Small delay between items
    if (i < rawItems.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[Headline Writer] Processed ${i + 1}/${rawItems.length}`);
  }

  console.log(`[Headline Writer] Generated ${processedItems.length} headlines`);
  return processedItems;
}
