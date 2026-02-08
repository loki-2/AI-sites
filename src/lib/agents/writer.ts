// ===========================================
// Enhanced Writer Agent
// ===========================================
// Purpose: Write SEO-optimized, human-grade articles

import { callGemini } from "@/lib/llm/gemini-direct";
import type { ProcessedItem, ArticleCategory } from "@/types";

// -------------------------------------------
// Unified Value-Focused Writing Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are a technical writer for VibeCoders - builders who use AI tools to ship products fast.

YOUR MISSION: Cut through marketing hype and deliver ACTIONABLE VALUE that readers can apply in their daily work.

CRITICAL: NO FLUFF, NO MARKETING SPEAK, NO HYPE. Every sentence must provide practical value.

MANDATORY ARTICLE STRUCTURE:

## Why It Matters
[Write exactly 5 one-sentence points explaining the practical impact]
- [Point 1: Specific benefit or problem it solves]
- [Point 2: Time/cost savings with numbers]
- [Point 3: Competitive advantage or unique capability]
- [Point 4: Who benefits most and why]
- [Point 5: Long-term impact or strategic value]

## How to Use It
[Write exactly 10 actionable points - steps, tips, or use cases]
1. [Specific action or use case with context]
2. [Another practical application]
3. [Implementation tip or gotcha to avoid]
4. [Configuration or setup step]
5. [Best practice or optimization]
6. [Common use case or scenario]
7. [Integration or workflow tip]
8. [Performance or cost consideration]
9. [Alternative approach or when not to use]
10. [Next step or advanced usage]

WRITING RULES:
✅ BE SPECIFIC: Include exact numbers, versions, prices, timeframes
✅ BE PRACTICAL: Every point must be actionable or directly useful
✅ BE DIRECT: No introductions, no conclusions, just value
✅ BE TECHNICAL: Assume readers are developers/builders
✅ USE EXAMPLES: Show real commands, code snippets, or scenarios

STRICTLY FORBIDDEN:
❌ NO marketing language: "revolutionary", "game-changing", "cutting-edge"
❌ NO AI phrases: "delve", "leverage", "robust", "comprehensive", "facilitate"
❌ NO fluff: "In today's world", "It's worth noting", "Let's explore"
❌ NO vague statements: Be specific or don't say it
❌ NO empty intensifiers: "very", "extremely", "incredibly"
❌ NO long paragraphs: Keep points concise and scannable

GOOD EXAMPLE:
## Why It Matters
- Reduces API response time by 40% compared to traditional REST endpoints
- Costs $0.01 per 1K tokens vs $0.03 for GPT-4, saving $200/month at scale
- Supports streaming responses, enabling real-time chat interfaces
- Works with existing OpenAI SDK, requiring zero code changes
- Processes 100K requests/day on free tier vs 10K on competitors

## How to Use It
1. Install the SDK: npm install openai@latest (requires v4.20+)
2. Set your API key: export OPENAI_API_KEY='sk-...'
3. Use gpt-4-turbo model name instead of gpt-4 in your requests
4. Enable streaming with stream: true for chat applications
5. Set max_tokens to 4096 for longer responses (vs 2048 default)
6. Use temperature 0.7 for creative tasks, 0.3 for factual content
7. Cache system prompts to save 50% on repeated requests
8. Monitor usage at platform.openai.com/usage to avoid overages
9. Avoid for tasks requiring GPT-4's full reasoning (complex math, deep analysis)
10. Combine with function calling for tool use and API integrations

BAD EXAMPLE:
"In today's rapidly evolving AI landscape, this groundbreaking technology leverages robust capabilities to facilitate comprehensive improvements. It's incredibly powerful and extremely versatile..."

Write like you're sharing insider tips with a fellow builder. Every word must earn its place.`;

// -------------------------------------------
// Write article for a single item
// -------------------------------------------

export async function writeArticle(
  item: ProcessedItem,
  category: ArticleCategory = "news"
): Promise<string> {
  const prompt = `Write an actionable article about this tool/news for builders:

Title: ${item.title}
URL: ${item.originalUrl}
Summary: ${item.summary}
Context: ${item.whyItMatters || "Relevant for builders"}
Tags: ${item.tags?.join(", ") || "tech"}

YOU MUST follow this EXACT structure:

## Why It Matters
[Write exactly 5 one-sentence points - be specific with numbers, comparisons, benefits]

## How to Use It
[Write exactly 10 actionable points - steps, tips, use cases, gotchas]

CRITICAL REQUIREMENTS:
- NO marketing hype or fluff
- EVERY point must be actionable or directly useful
- Include specific numbers, versions, prices when available
- Use real examples, commands, or code snippets
- Focus on practical value builders can apply TODAY

FORBIDDEN WORDS: delve, leverage, robust, comprehensive, facilitate, revolutionary, game-changing, cutting-edge

Write the article now (include the ## headlines).`;

  try {
    const { text } = await callGemini(prompt, SYSTEM_PROMPT, {
      temperature: 0.6, // Lower for more focused, less fluffy content
      maxOutputTokens: 2048,
    });

    let article = text.trim();

    // Remove any title if LLM added one
    if (article.startsWith("#") && !article.startsWith("## Why It Matters")) {
      const lines = article.split("\n");
      const firstHeadingIndex = lines.findIndex(line => line.startsWith("## Why It Matters"));
      if (firstHeadingIndex > 0) {
        article = lines.slice(firstHeadingIndex).join("\n").trim();
      }
    }

    const wordCount = article.split(/\s+/).length;
    console.log(`[Writer] Generated article for "${item.title}" (${wordCount} words)`);
    return article;
  } catch (error) {
    console.error(`[Writer] Error writing article for "${item.title}":`, error);
    throw error;
  }
}

// -------------------------------------------
// Write articles for multiple items
// -------------------------------------------

export async function writeArticles(
  items: ProcessedItem[]
): Promise<Map<string, string>> {
  console.log(`[Writer] Writing articles for ${items.length} items...`);

  const articles = new Map<string, string>();

  // Process one at a time to maintain quality
  for (const item of items) {
    try {
      const article = await writeArticle(item, item.category);
      articles.set(item.id, article);

      // Rate limit delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[Writer] Failed to write article for "${item.title}"`);
    }
  }

  console.log(`[Writer] Successfully wrote ${articles.size} articles`);
  return articles;
}
