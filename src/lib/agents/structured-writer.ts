// ===========================================
// Structured Blog Writer (Single-Call JSON Mode)
// ===========================================
// Generates articles with mandatory 3-section structure using a single LLM call

import { callGeminiJSON } from "@/lib/llm/gemini-direct";
import type { ProcessedItem } from "@/types";
import {
    type StructuredArticle,
    validateStructure,
    formatAsMarkdown,
    validateContent
} from "@/lib/blog/structure";

// -------------------------------------------
// System Prompt for Structured Writing
// -------------------------------------------

const SYSTEM_PROMPT = `You are a technical writer for VibeCoders - builders who use AI tools to ship products fast.

YOUR MISSION: Generate structured, actionable articles that builders can use TODAY.

You MUST respond with a JSON object containing exactly 3 arrays:

{
  "whyItMatters": [5 one-sentence points],
  "whenToUse": [10 use case points],
  "howToUse": [10 actionable how-to points]
}

SECTION 1: "whyItMatters" (exactly 5 points)
- Each point is ONE sentence explaining a specific benefit
- Include concrete numbers, comparisons, or measurable impacts
- Focus on practical value: time saved, cost reduced, problems solved
- Examples:
  ✅ "Reduces API response time by 40% compared to traditional REST endpoints"
  ✅ "Costs $0.01 per 1K tokens vs $0.03 for GPT-4, saving $200/month at scale"
  ❌ "It's a very powerful and comprehensive solution"

SECTION 2: "whenToUse" (exactly 10 points)
- Specific scenarios, use cases, or situations where this is valuable
- Who benefits and why
- Include both common and advanced use cases
- Examples:
  ✅ "Building real-time chat applications that need streaming responses"
  ✅ "Prototyping MVPs where speed matters more than custom infrastructure"
  ❌ "When you need a robust solution for your business"

SECTION 3: "howToUse" (exactly 10 points)
- Actionable steps, commands, tips, or configuration details
- Include code snippets, version numbers, specific commands
- Mix of setup steps, best practices, and gotchas
- Examples:
  ✅ "Install the SDK: npm install openai@latest (requires v4.20+)"
  ✅ "Set temperature to 0.7 for creative tasks, 0.3 for factual content"
  ✅ "Avoid for complex math or deep analysis - use GPT-4 instead"
  ❌ "Use it to leverage the comprehensive capabilities"

CRITICAL RULES:
✅ BE SPECIFIC: Include exact numbers, versions, prices, timeframes
✅ BE ACTIONABLE: Every point must be directly useful
✅ BE TECHNICAL: Assume readers are developers/builders
✅ USE EXAMPLES: Show real commands, code, or scenarios

STRICTLY FORBIDDEN WORDS:
❌ delve, leverage, robust, comprehensive, facilitate
❌ revolutionary, game-changing, cutting-edge, synergy
❌ paradigm, holistic, seamless
❌ Marketing hype or vague intensifiers

Write like you're sharing insider tips with a fellow builder. Every word must earn its place.`;

// -------------------------------------------
// Generate Structured Article
// -------------------------------------------

export async function writeStructuredArticle(
    item: ProcessedItem
): Promise<string> {
    const prompt = `Generate a structured article about this tool/news for builders:

Title: ${item.title}
URL: ${item.originalUrl}
Summary: ${item.summary}
Context: ${item.whyItMatters || "Relevant for builders"}
Tags: ${item.tags?.join(", ") || "tech"}

Generate a JSON object with exactly:
- "whyItMatters": array of 5 one-sentence benefit points
- "whenToUse": array of 10 specific use case points
- "howToUse": array of 10 actionable how-to points

Focus on practical, specific, actionable information. Include numbers, versions, commands, and real examples.`;

    try {
        console.log(`[StructuredWriter] Generating article for: ${item.title}`);

        // Call Gemini with JSON mode
        const article = await callGeminiJSON<StructuredArticle>(prompt, SYSTEM_PROMPT, {
            temperature: 0.6,
            maxOutputTokens: 4096,
        });

        // Validate structure
        const validation = validateStructure(article);
        if (!validation.isValid) {
            console.warn(`[StructuredWriter] Structure validation failed:`, validation.errors);
            // Try to fix common issues
            article.whyItMatters = article.whyItMatters?.slice(0, 5) || [];
            article.whenToUse = article.whenToUse?.slice(0, 10) || [];
            article.howToUse = article.howToUse?.slice(0, 10) || [];

            // Pad if needed
            while (article.whyItMatters.length < 5) {
                article.whyItMatters.push("Additional benefit to be determined");
            }
            while (article.whenToUse.length < 10) {
                article.whenToUse.push("Additional use case to be determined");
            }
            while (article.howToUse.length < 10) {
                article.howToUse.push("Additional step to be determined");
            }
        }

        // Validate content quality
        const contentValidation = validateContent(article);
        if (contentValidation.forbiddenWords.length > 0) {
            console.warn(`[StructuredWriter] Found forbidden words:`, contentValidation.forbiddenWords);
        }
        if (!contentValidation.hasSpecifics) {
            console.warn(`[StructuredWriter] Article lacks specific numbers/details`);
        }

        // Format as markdown
        const markdown = formatAsMarkdown(article);

        const wordCount = markdown.split(/\s+/).length;
        console.log(`[StructuredWriter] Generated article (${wordCount} words, ${article.whyItMatters.length + article.whenToUse.length + article.howToUse.length} points)`);

        return markdown;
    } catch (error) {
        console.error(`[StructuredWriter] Error generating article:`, error);
        throw error;
    }
}
