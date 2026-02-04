// ===========================================
// Writer Agent with Reviewer Feedback Loop
// ===========================================
// Writer creates article → Reviewer gives feedback → Writer rewrites ONCE

import { callGemini, callGeminiJSON } from "@/lib/llm/gemini-direct";
import type { ProcessedItem } from "@/types";

// -------------------------------------------
// Types
// -------------------------------------------

interface ReviewFeedback {
  qualityScore: number; // 1-10
  isGoodEnough: boolean; // true if score >= 8
  improvedTitle: string;
  feedback: string[]; // List of specific improvements needed
  rewriteInstructions: string; // Specific instructions for rewrite
}

interface ArticleResult {
  title: string;
  content: string;
  iterations: number;
  finalScore: number;
}

// -------------------------------------------
// Writer Prompt
// -------------------------------------------

const WRITER_SYSTEM_PROMPT = `You are a tech writer for VibeCoders - a community of builders who use AI tools to ship products fast.

Your writing style:
- Builder-first tone: You're writing for people who BUILD, not just read
- Scannable: Use short paragraphs
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
- Keep it under 250 words`;

// -------------------------------------------
// Reviewer Prompt
// -------------------------------------------

const REVIEWER_SYSTEM_PROMPT = `You are a senior editor for VibeCoders - a tech publication for builders who use AI to ship fast.

Your job is to review articles and provide SPECIFIC, ACTIONABLE feedback for the writer to improve.

Evaluate on these criteria:
1. HEADLINE (10 points)
   - Is it specific and actionable?
   - Does it include the key benefit?
   - Is it under 80 characters?

2. OPENING HOOK (10 points)
   - Does it grab attention immediately?
   - Does it explain why this matters NOW?

3. VALUE DENSITY (10 points)
   - Does every sentence add information?
   - Are there any filler phrases to cut?

4. BUILDER FOCUS (10 points)
   - Is it written for people who BUILD?
   - Does it tell readers what they can DO?

5. LENGTH & STRUCTURE (10 points)
   - Is it 150-250 words?
   - Is it scannable with short paragraphs?

Score out of 50, then convert to 1-10 scale.

If score < 8: Provide specific rewrite instructions
If score >= 8: Article is good enough to publish

Be specific! Instead of "improve the opening", say "The opening talks about the company - start with what the USER can do instead."`;

// -------------------------------------------
// Write Initial Article
// -------------------------------------------

async function writeInitialArticle(item: ProcessedItem): Promise<string> {
  const prompt = `Write a short article (150-250 words) about this:

Title: ${item.title}
URL: ${item.originalUrl}
Summary: ${item.summary}
Why it matters: ${item.whyItMatters || "Important for builders"}
Tags: ${item.tags?.join(", ") || "tech"}

Write the article now. Start directly with the content, no title needed.`;

  const { text } = await callGemini(prompt, WRITER_SYSTEM_PROMPT, {
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  // Clean up
  let article = text.trim();
  if (article.startsWith("#")) {
    article = article.split("\n").slice(1).join("\n").trim();
  }

  return article;
}

// -------------------------------------------
// Review Article and Give Feedback
// -------------------------------------------

async function reviewArticle(
  item: ProcessedItem,
  article: string
): Promise<ReviewFeedback> {
  const prompt = `Review this article. Respond with ONLY a JSON object, no markdown.

HEADLINE: ${item.title}

ARTICLE:
${article}

JSON format (copy this structure exactly):
{"qualityScore":7,"isGoodEnough":false,"improvedTitle":"Your improved title here","feedback":["Issue 1","Issue 2"],"rewriteInstructions":"What to fix"}`;

  try {
    const result = await callGeminiJSON<ReviewFeedback>(prompt, REVIEWER_SYSTEM_PROMPT, {
      temperature: 0.3,
      maxOutputTokens: 4096,
    });
    return result;
  } catch (error) {
    console.error(`[Reviewer] JSON parse failed, using default feedback:`, (error as Error).message);
    // Return default feedback so article can still be improved
    return {
      qualityScore: 6,
      isGoodEnough: false,
      improvedTitle: item.title,
      feedback: [
        "Make the opening more attention-grabbing",
        "Add more specific actionable details for builders",
      ],
      rewriteInstructions: "Improve the hook, add specific details, and make it more actionable for developers who want to use this.",
    };
  }
}

// -------------------------------------------
// Rewrite Article Based on Feedback
// -------------------------------------------

async function rewriteArticle(
  item: ProcessedItem,
  previousArticle: string,
  feedback: ReviewFeedback
): Promise<string> {
  const prompt = `You wrote this article, but the editor wants revisions.

ORIGINAL ARTICLE:
${previousArticle}

EDITOR'S FEEDBACK:
${feedback.feedback.map((f, i) => `${i + 1}. ${f}`).join("\n")}

SPECIFIC REWRITE INSTRUCTIONS:
${feedback.rewriteInstructions}

CONTEXT:
- Title: ${item.title}
- URL: ${item.originalUrl}
- Summary: ${item.summary}

Now rewrite the article addressing ALL the feedback. Keep it 150-250 words.
Write only the article content, no explanations.`;

  const { text } = await callGemini(prompt, WRITER_SYSTEM_PROMPT, {
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  // Clean up
  let article = text.trim();
  if (article.startsWith("#")) {
    article = article.split("\n").slice(1).join("\n").trim();
  }

  return article;
}

// -------------------------------------------
// Main: Write Article with Single Feedback Loop
// -------------------------------------------

export async function writeArticleWithFeedback(
  item: ProcessedItem
): Promise<ArticleResult> {
  console.log(`[Writer+Reviewer] Starting for: ${item.title}`);

  // Step 1: Writer creates initial draft
  let article = await writeInitialArticle(item);
  let currentTitle = item.title;

  console.log(`[Writer+Reviewer] Initial draft complete (${article.split(/\s+/).length} words)`);

  // Step 2: Reviewer reviews and gives feedback
  const feedback = await reviewArticle({ ...item, title: currentTitle }, article);

  console.log(`[Writer+Reviewer] Review complete: Score ${feedback.qualityScore}/10`);
  console.log(`[Writer+Reviewer] Feedback: ${feedback.feedback.join("; ")}`);

  // Update title if reviewer suggested improvement
  if (feedback.improvedTitle && feedback.improvedTitle !== currentTitle) {
    currentTitle = feedback.improvedTitle;
    console.log(`[Writer+Reviewer] Improved title: ${currentTitle}`);
  }

  // Step 3: Writer rewrites based on feedback (always rewrite once)
  console.log(`[Writer+Reviewer] Rewriting based on feedback...`);
  article = await rewriteArticle(item, article, feedback);
  console.log(`[Writer+Reviewer] Final article complete (${article.split(/\s+/).length} words)`);

  return {
    title: currentTitle,
    content: article,
    iterations: 1,
    finalScore: feedback.qualityScore,
  };
}
