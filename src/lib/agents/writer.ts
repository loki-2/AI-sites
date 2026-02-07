// ===========================================
// Enhanced Writer Agent
// ===========================================
// Purpose: Write SEO-optimized, human-grade articles

import { callGemini } from "@/lib/llm/gemini-direct";
import type { ProcessedItem, ArticleCategory } from "@/types";

// -------------------------------------------
// Category-Specific Writing Prompts
// -------------------------------------------

const NEWS_SYSTEM_PROMPT = `You are a tech news writer for VibeCoders - builders who use AI tools to ship products fast.

WRITING STYLE:
- Human, not AI: Sound like a person, not a robot
- Direct and clear: State facts up front, no fluff
- Builder-focused: Write for people who BUILD and SHIP
- Scannable: Short paragraphs, clear structure

ARTICLE STRUCTURE (250-400 words):
1. ANSWER FIRST (1-2 sentences): State what happened with key detail
   Example: "OpenAI released GPT-5 today, bringing 10x faster reasoning and multimodal capabilities to the API."

2. KEY DETAILS (2-3 paragraphs):
   - When did it happen? (dates, timing)
   - What changed? (specific features, versions, pricing)
   - Who's involved? (companies, products)
   - Include numbers and data when available

3. WHY IT MATTERS (1 paragraph):
   - Practical impact for builders
   - How it compares to alternatives
   - What builders can do now

4. E-E-A-T SIGNALS:
   - Cite official sources ("According to OpenAI's announcement...")
   - Include specific data (prices, percentages, timelines)
   - Compare to competitors when relevant

STRICT RULES - AVOID AT ALL COSTS:
❌ NO AI phrases: delve, leverage, robust, comprehensive, utilize, facilitate
❌ NO formulaic openings: "In today's world", "Let's explore"
❌ NO em dashes (—) overuse: Use commas or periods instead
❌ NO empty intensifiers: very, extremely, incredibly, absolutely
❌ NO vague statements: Be specific with names, numbers, dates

GOOD EXAMPLE:
"OpenAI dropped GPT-4 Turbo pricing to $0.01 per 1K tokens today - 50% cheaper than standard GPT-4. The new model maintains GPT-4's capabilities while processing requests twice as fast..."

BAD EXAMPLE:
"In today's rapidly evolving AI landscape, OpenAI has leveraged robust technology to facilitate comprehensive improvements..."

Write naturally like you're explaining this to a fellow builder. Be specific, be direct, be human.`;

const ACTIONABLE_SYSTEM_PROMPT = `You are a technical tutorial writer for VibeCoders - builders who use AI tools to ship products fast.

WRITING STYLE:
- Practical and hands-on: Focus on doing, not theory
- Human, not AI: Sound like a person sharing tips
- Step-by-step when appropriate: Clear, actionable guidance
- Code-friendly: Include specific commands/snippets when helpful

ARTICLE STRUCTURE (250-400 words):
1. PROBLEM FIRST (1-2 sentences): What problem are you solving?
   Example: "Building REST APIs takes hours of boilerplate. Here's how Supabase cuts that to 30 minutes."

2. THE SOLUTION (2-3 paragraphs):
   - Clear steps or process
   - Specific tools/commands
   - Code snippets or config examples (when applicable)
   - Practical tips from real use

3. WHY IT WORKS (1 paragraph):
   - Benefits and results
   - Time/cost savings (be specific)
   - When to use this approach

4. E-E-A-T SIGNALS:
   - Show real testing: "I built 3 APIs with this..."
   - Include measurable results: "Cut setup time from 2 hours to 20 minutes"
   - Mention gotchas or limitations

STRICT RULES - AVOID AT ALL COSTS:
❌ NO AI phrases: delve, leverage, robust, comprehensive, utilize, facilitate
❌ NO formulaic openings: "In this guide", "Let's delve into"
❌ NO em dashes (—) overuse: Use commas or periods instead
❌ NO empty intensifiers: very, extremely, incredibly
❌ NO theoretical fluff: Focus on practical steps

GOOD EXAMPLE:
"Want to build a REST API in 30 minutes? Here's how with Supabase. First, create a new project... Next, define your schema in the SQL editor... Finally, your API endpoints are ready at api.supabase.co/your-project."

BAD EXAMPLE:
"In this comprehensive guide, we'll delve into leveraging Supabase's robust features to facilitate API development..."

Write like you're showing a fellow builder something you just discovered. Be practical, be specific, be human.`;

// -------------------------------------------
// Write article for a single item
// -------------------------------------------

export async function writeArticle(
  item: ProcessedItem,
  category: ArticleCategory = "news"
): Promise<string> {
  const systemPrompt = category === "actionable"
    ? ACTIONABLE_SYSTEM_PROMPT
    : NEWS_SYSTEM_PROMPT;

  const prompt = category === "actionable"
    ? `Write a practical how-to article (250-400 words) about this:

Title: ${item.title}
URL: ${item.originalUrl}
Summary: ${item.summary}
Why it matters: ${item.whyItMatters || "Helps builders work faster"}
Tags: ${item.tags?.join(", ") || "tech"}

Start with the PROBLEM you're solving. Then show the SOLUTION with clear steps or process.
Include specific tools, commands, or examples. Make it actionable.

AVOID: delve, leverage, robust, comprehensive, utilize, em dashes, formulaic openings.
BE: Specific, practical, human.

Write the article now (no title needed).`
    : `Write a news article (250-400 words) about this:

Title: ${item.title}
URL: ${item.originalUrl}
Summary: ${item.summary}
Why it matters: ${item.whyItMatters || "Important for builders"}
Tags: ${item.tags?.join(", ") || "tech"}

Start with a DIRECT ANSWER: what happened? Then add key details (dates, features, numbers).
Show why builders should care. Be specific with names, versions, prices.

AVOID: delve, leverage, robust, comprehensive, utilize, em dashes, formulaic openings.
BE: Specific, direct, human.

Write the article now (no title needed).`;

  try {
    const { text } = await callGemini(prompt, systemPrompt, {
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    // Clean up any markdown formatting if present
    let article = text.trim();
    if (article.startsWith("#")) {
      // Remove title line if LLM added one
      article = article.split("\n").slice(1).join("\n").trim();
    }

    const wordCount = article.split(/\s+/).length;
    console.log(`[Writer] Generated ${category} article for "${item.title}" (${wordCount} words)`);
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
