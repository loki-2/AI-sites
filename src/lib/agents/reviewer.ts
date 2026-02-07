// ===========================================
// Enhanced Reviewer Agent
// ===========================================
// Purpose: Improve quality, remove AI patterns, ensure human-grade content

import { callGeminiJSON } from "@/lib/llm/gemini-direct";
import type { ProcessedItem, ArticleCategory } from "@/types";
import { detectAIPhrases, calculateHumanScore, countEmDashes } from "@/lib/seo/ai-phrases";

// -------------------------------------------
// Enhanced Reviewer Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are a senior editor for VibeCoders - a tech publication for builders who use AI to ship fast.

Your job is to transform AI-written content into HUMAN-GRADE articles. Be ruthless about quality.

REVIEW CHECKLIST:

1. IMPROVE THE TITLE (if needed)
   - Make it specific and data-driven
   - Include numbers/percentages/timeframes
   - Keep under 80 characters
   - Remove vague words

2. REMOVE AI PATTERNS
   - Delete AI phrases: delve, leverage, robust, comprehensive, utilize, facilitate
   - Remove formulaic openings: "In today's world", "Let's explore"
   - Replace em dashes (—) with commas or periods
   - Cut empty intensifiers: very, extremely, incredibly
   - Fix repetitive sentence structures

3. CHECK CONTENT STRUCTURE
   - For NEWS: Starts with direct answer? Has specific details?
   - For ACTIONABLE: Starts with problem? Has clear steps/process?
   - Answer-first pattern: Does it answer the question up front?

4. ADD E-E-A-T SIGNALS (if missing)
   - NEWS: Add "According to [source]..." or cite official announcements
   - ACTIONABLE: Add "In testing..." or "This saved X hours..."
   - Include specific numbers, dates, versions

5. ENSURE VALUE DENSITY
   - Every sentence must add information
   - Cut filler phrases and redundancy
   - Keep 250-400 words (optimal SEO length)

6. MAKE IT HUMAN
   - Use contractions (it's, you're, we'll)
   - Vary sentence length (mix short and long)
   - Sound conversational, not robotic
   - Be specific, not generic

OUTPUT:
- Improved title (if changes needed)
- Improved content (human-grade, no AI patterns)
- List of changes made
- Human-like score (1-10)

Respond in JSON format only.`;

// -------------------------------------------
// Review a single article
// -------------------------------------------

interface ReviewResult {
  improvedTitle: string;
  improvedContent: string;
  changes: string[];
  humanLikeScore: number;
  aiPhrasesRemoved: string[];
  categoryCompliance: boolean;
}

export async function reviewArticle(
  item: ProcessedItem,
  originalContent: string
): Promise<{ title: string; content: string; humanScore: number }> {
  // Pre-check: Detect AI phrases in original
  const detectedPhrases = detectAIPhrases(originalContent);
  const emDashCount = countEmDashes(originalContent);
  const originalHumanScore = calculateHumanScore(originalContent);

  const prompt = `Review and improve this ${item.category} article to make it HUMAN-GRADE:

ORIGINAL TITLE: ${item.title}

ORIGINAL ARTICLE:
${originalContent}

CONTEXT:
- Category: ${item.category}
- Source: ${item.originalUrl}
- Tags: ${item.tags?.join(", ") || "tech"}
- Summary: ${item.summary}

PRE-CHECK RESULTS:
- AI phrases detected: ${detectedPhrases.length > 0 ? detectedPhrases.join(", ") : "None"}
- Em dash count: ${emDashCount}
- Current human score: ${originalHumanScore}/10

YOUR TASK:
1. Remove ALL AI phrases
2. Ensure answer-first pattern for ${item.category} articles
3. Add E-E-A-T signals (sources, data, testing notes)
4. Make it sound HUMAN (contractions, varied sentences, conversational)
5. Keep 250-400 words

Respond with ONLY valid JSON:
{"improvedTitle": "Better title (max 80 chars)", "improvedContent": "Human-grade article (250-400 words)", "changes": ["change1", "change2"], "humanLikeScore": 9, "aiPhrasesRemoved": ["phrase1"], "categoryCompliance": true}`;

  try {
    const parsed = await callGeminiJSON<ReviewResult>(prompt, SYSTEM_PROMPT, {
      temperature: 0.3,
      maxOutputTokens: 3072,
    });

    const finalHumanScore = parsed.humanLikeScore || calculateHumanScore(parsed.improvedContent);

    console.log(`[Reviewer] "${item.title}"`);
    console.log(`  Human score: ${originalHumanScore} → ${finalHumanScore}/10`);
    console.log(`  AI phrases removed: ${parsed.aiPhrasesRemoved?.length || 0}`);
    console.log(`  Category compliant: ${parsed.categoryCompliance ? "✓" : "✗"}`);

    if (parsed.changes && parsed.changes.length > 0) {
      console.log(`  Changes: ${parsed.changes.join(", ")}`);
    }

    return {
      title: parsed.improvedTitle || item.title,
      content: parsed.improvedContent || originalContent,
      humanScore: finalHumanScore,
    };
  } catch (error) {
    console.error(`[Reviewer] Error reviewing "${item.title}":`, error);
    console.error(`[Reviewer] Error details:`, (error as Error).message);
    
    // Fallback: Return original with minimal improvements
    // Remove obvious AI phrases manually as a fallback
    let fallbackContent = originalContent;
    const aiPhrasesToRemove = ["delve", "leverage", "robust", "comprehensive"];
    aiPhrasesToRemove.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      fallbackContent = fallbackContent.replace(regex, '');
    });
    
    console.log(`[Reviewer] Using fallback (manual AI phrase removal)`);
    
    return {
      title: item.title,
      content: fallbackContent.trim() || originalContent,
      humanScore: originalHumanScore,
    };
  }
}

// -------------------------------------------
// Review multiple articles
// -------------------------------------------

export async function reviewArticles(
  items: ProcessedItem[],
  articles: Map<string, string>
): Promise<Map<string, { title: string; content: string; humanScore: number }>> {
  console.log(`[Reviewer] Reviewing ${items.length} articles for human-grade quality...`);

  const reviewed = new Map<string, { title: string; content: string; humanScore: number }>();

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
      reviewed.set(item.id, {
        title: item.title,
        content: originalContent,
        humanScore: calculateHumanScore(originalContent)
      });
    }
  }

  const avgHumanScore = Array.from(reviewed.values())
    .reduce((sum, r) => sum + r.humanScore, 0) / reviewed.size;

  console.log(`[Reviewer] Successfully reviewed ${reviewed.size} articles`);
  console.log(`[Reviewer] Average human-like score: ${avgHumanScore.toFixed(1)}/10`);

  return reviewed;
}
