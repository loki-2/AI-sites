// ===========================================
// Enhanced Headline Writer Agent
// ===========================================
// Purpose: Create hookable, SEO-optimized headlines for builders

import { callGeminiJSON } from "@/lib/llm/gemini-direct";
import type { RawItem, ProcessedItem } from "@/types";

// -------------------------------------------
// SEO-Optimized Headline Writer Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are an expert headline writer for VibeCoders - builders who use AI tools to ship fast.

Your headlines must be HOOKABLE and SPECIFIC. Use these category-specific formulas:

NEWS HEADLINES (announcements, launches, updates):
✓ "[Company] launches [Tool] with [Specific Feature] - [Key Benefit]"
✓ "[Number]% improvement: [Tool] rolls out [Feature]"
✓ "[Tool vs Tool]: [Company] takes on [Competitor] with [Innovation]"
✓ "Breaking: [Event] makes [Impact] for [Audience]"

ACTIONABLE HEADLINES (tutorials, how-tos):
✓ "How to [Achieve Result] using [Tool] in [Timeframe]"
✓ "Build [Thing] with [Tool] - Step-by-step guide"
✓ "[Number] ways to [Solve Problem] with [Approach]"
✓ "From [Starting Point] to [End Goal]: [Tool] tutorial"

RULES:
1. Include NUMBERS/DATA when possible (percentages, timeframes, versions)
2. Be SPECIFIC - mention exact tools, features, benefits
3. Max 80 characters
4. NO clickbait ("You won't believe...")
5. NO vague headlines ("Major Update Released")
6. NO AI phrases: avoid "delve", "leverage", "robust", "comprehensive"

GOOD EXAMPLES:
✓ "Cursor now auto-fixes TypeScript errors - 40% faster debugging"
✓ "Build a REST API with Supabase in 30 minutes"
✓ "GPT-4 Turbo drops to $0.01/1K tokens - 50% cheaper than GPT-4"

BAD EXAMPLES:
✗ "New AI Tool Released" (too vague)
✗ "Leveraging Robust AI Solutions" (AI-sounding)
✗ "You Won't Believe This!" (clickbait)

Create compelling, data-driven headlines that make builders click. Respond with JSON only.`;

// -------------------------------------------
// Process a single item
// -------------------------------------------

interface HeadlineResult {
  headline: string;
  summary: string;
  whyItMatters: string;
  tags: string[];
  category: "news" | "actionable";
  relevanceScore: number;
}

async function processItem(item: RawItem): Promise<ProcessedItem | null> {
  const prompt = `Transform this into a compelling headline for builders who use AI to ship fast.

Original Title: ${item.title}
Source: ${item.source}
Content Preview: ${item.content?.slice(0, 300) || 'N/A'}

First, classify as "news" or "actionable":
- NEWS = announcements, launches, funding, acquisitions, product releases, updates
- ACTIONABLE = tutorials, how-to guides, step-by-step instructions, code examples

Then create a HOOKABLE headline using the category-specific formulas from the system prompt.
Include numbers/data if available (percentages, timeframes, versions).
Make it SPECIFIC - mention exact tools, features, benefits.

Avoid AI phrases: delve, leverage, robust, comprehensive, utilize.

Respond with ONLY valid JSON:
{"headline": "Specific headline with data/numbers (max 80 chars)", "summary": "Clear one-line summary", "whyItMatters": "Why builders care - be specific", "tags": ["tag1", "tag2"], "category": "news", "relevanceScore": 75}`;

  try {
    const result = await callGeminiJSON<HeadlineResult>(prompt, SYSTEM_PROMPT, {
      temperature: 0.7, // Increased for more creative, hookable headlines
      maxOutputTokens: 2048,
    });

    return {
      id: item.id || crypto.randomUUID(),
      title: result.headline,
      originalUrl: item.url,
      summary: result.summary,
      tags: result.tags || [],
      category: result.category || "news",
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
