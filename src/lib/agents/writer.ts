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

Write structured, actionable articles with these mandatory sections:
- Why It Matters (5 specific benefit points)
- When to Use (10 use case points)
- How to Use (10 actionable how-to points)

Be specific, technical, and actionable. No marketing hype.`;

// -------------------------------------------
// Write article for a single item
// -------------------------------------------

export async function writeArticle(
  item: ProcessedItem,
  category: ArticleCategory = "news"
): Promise<string> {
  // Use the new workflow-based writer with reviewer feedback loop
  const { runArticleWorkflow } = await import("./workflows/article-workflow");
  return runArticleWorkflow(item);
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
