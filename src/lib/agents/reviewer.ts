// ===========================================
// Reviewer Agent
// ===========================================
// Purpose: Improve title, remove fluff, ensure quality

import { callGeminiJSON } from "@/lib/llm/gemini-direct";
import type { ProcessedItem } from "@/types";

// -------------------------------------------
// Reviewer Agent Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are an editor for VibeCoders - a tech publication for builders who use AI to ship fast.

Your job is to review and improve articles:

1. IMPROVE THE TITLE
   - Make it specific and actionable
   - Include the key benefit or news
   - Keep it under 80 characters
   - Remove clickbait, add substance

2. REMOVE FLUFF
   - Cut filler phrases ("In today's world", "It's worth noting")
   - Remove redundant words
   - Tighten sentences

3. ENSURE VALUE DENSITY
   - Every sentence must add information
   - If a paragraph doesn't help the reader, cut it
   - Add specific details if missing (but don't make things up)

4. CHECK LENGTH
   - Must be 150-250 words
   - If too long, cut the weakest parts
   - If too short, it might be missing key info (flag it)

5. FIX QUALITY ISSUES
   - Fix awkward phrasing
   - Ensure logical flow
   - Check that it answers: What? Why? What now?

Respond in JSON format only.`;

// -------------------------------------------
// Review a single article
// -------------------------------------------

interface ReviewResult {
  improvedTitle: string;
  improvedContent: string;
  changes: string[];
  qualityScore: number;
}

export async function reviewArticle(
  item: ProcessedItem,
  originalContent: string
): Promise<{ title: string; content: string }> {
  const prompt = `Review and improve this article:

ORIGINAL TITLE: ${item.title}

ORIGINAL ARTICLE:
${originalContent}

CONTEXT:
- Source: ${item.originalUrl}
- Tags: ${item.tags?.join(", ") || "tech"}
- Summary: ${item.summary}

Respond with ONLY valid JSON (no markdown):
{"improvedTitle": "Better title here (max 80 chars)", "improvedContent": "The edited article text (150-250 words)", "changes": ["change1", "change2"], "qualityScore": 8}`;

  try {
    const parsed = await callGeminiJSON<ReviewResult>(prompt, SYSTEM_PROMPT, {
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    console.log(`[Reviewer] Reviewed "${item.title}" -> "${parsed.improvedTitle}" (Quality: ${parsed.qualityScore}/10)`);
    if (parsed.changes && parsed.changes.length > 0) {
      console.log(`[Reviewer] Changes: ${parsed.changes.join(", ")}`);
    }

    return {
      title: parsed.improvedTitle || item.title,
      content: parsed.improvedContent || originalContent,
    };
  } catch (error) {
    console.error(`[Reviewer] Error reviewing "${item.title}":`, error);
    // Return original if review fails
    return {
      title: item.title,
      content: originalContent,
    };
  }
}

// -------------------------------------------
// Review multiple articles
// -------------------------------------------

export async function reviewArticles(
  items: ProcessedItem[],
  articles: Map<string, string>
): Promise<Map<string, { title: string; content: string }>> {
  console.log(`[Reviewer] Reviewing ${items.length} articles...`);

  const reviewed = new Map<string, { title: string; content: string }>();

  for (const item of items) {
    const originalContent = articles.get(item.id);
    if (!originalContent) {
      console.warn(`[Reviewer] No article found for item ${item.id}`);
      continue;
    }

    try {
      const result = await reviewArticle(item, originalContent);
      reviewed.set(item.id, result);

      // Rate limit delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[Reviewer] Failed to review "${item.title}"`);
      reviewed.set(item.id, { title: item.title, content: originalContent });
    }
  }

  console.log(`[Reviewer] Successfully reviewed ${reviewed.size} articles`);
  return reviewed;
}
