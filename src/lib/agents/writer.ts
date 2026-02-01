// ===========================================
// Writer Agent
// ===========================================
// Purpose: Write short, scannable articles (150-250 words)

import { callGemini } from "@/lib/llm/gemini-direct";
import type { ProcessedItem } from "@/types";

// -------------------------------------------
// Writer Agent Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are a tech writer for VibeCoders - a community of builders who use AI tools to ship products fast.

Your writing style:
- Builder-first tone: You're writing for people who BUILD, not just read
- Scannable: Use short paragraphs, bold key points if needed
- Value-dense: Every sentence should add information
- Action-oriented: Tell readers what they can DO with this info

Article format (150-250 words, NO MORE):
1. Opening hook (1 sentence) - What happened and why it matters NOW
2. What changed (1-2 paragraphs) - The key facts
3. Why it matters for builders (1 paragraph) - Practical implications
4. When to use it / Next steps (1-2 sentences) - Clear action item

Rules:
- Assume the reader is a builder, not a journalist
- No fluff, no filler phrases like "In today's fast-paced world"
- No unnecessary adjectives or hype
- Include specific details (names, versions, numbers)
- If it's a tool, mention what problem it solves
- Keep it under 250 words - seriously, count them

Respond with the article text only, no JSON or markdown formatting.`;

// -------------------------------------------
// Write article for a single item
// -------------------------------------------

export async function writeArticle(item: ProcessedItem): Promise<string> {
  const prompt = `Write a short article (150-250 words) about this:

Title: ${item.title}
URL: ${item.originalUrl}
Summary: ${item.summary}
Why it matters: ${item.whyItMatters || "Important for builders"}
Tags: ${item.tags?.join(", ") || "tech"}

Write the article now. Start directly with the content, no title needed (the title will be shown separately).`;

  try {
    const { text } = await callGemini(prompt, SYSTEM_PROMPT, {
      temperature: 0.7,
      maxOutputTokens: 1024,
    });
    
    // Clean up any markdown formatting if present
    let article = text.trim();
    if (article.startsWith("#")) {
      // Remove title line if LLM added one
      article = article.split("\n").slice(1).join("\n").trim();
    }

    console.log(`[Writer] Generated article for "${item.title}" (${article.split(/\s+/).length} words)`);
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
      const article = await writeArticle(item);
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
