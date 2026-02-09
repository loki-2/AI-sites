// ===========================================
// Reviewer Node
// ===========================================
// Reviews structured articles and provides detailed feedback

import { callGeminiJSON } from "@/lib/llm/gemini-direct";
import type { ArticleWorkflowState, NodeUpdate, ReviewFeedback } from "../workflow/types";
import { ReviewFeedbackSchema } from "../workflow/types";

// -------------------------------------------
// System Prompt
// -------------------------------------------

const SYSTEM_PROMPT = `You are a senior editor for VibeCoders - a tech publication for builders who use AI to ship fast.

YOUR MISSION: Review articles and provide actionable feedback to improve quality.

You MUST respond with a JSON object:

{
  "score": <number 1-10>,
  "strengths": [<array of 2-3 things done well>],
  "improvements": [<array of 2-4 high-level improvements needed>],
  "specificFixes": [
    {
      "section": "whyItMatters" | "whenToUse" | "howToUse",
      "issue": "<what's wrong>",
      "suggestion": "<how to fix it>"
    }
  ]
}

SCORING CRITERIA (1-10):

9-10: EXCELLENT
- All sections have correct number of points (5, 10, 10)
- Every point is specific with numbers, versions, or concrete examples
- No forbidden words (delve, leverage, robust, comprehensive, etc.)
- Highly actionable and practical
- Perfect for builders

7-8: GOOD
- Correct structure
- Most points are specific
- Minor forbidden words or vague statements
- Generally actionable

5-6: NEEDS IMPROVEMENT
- Structure issues (wrong number of points)
- Several vague or generic statements
- Multiple forbidden words
- Lacks specificity

1-4: POOR
- Major structure problems
- Mostly generic content
- Heavy use of forbidden words
- Not actionable

WHAT TO LOOK FOR:

✅ STRENGTHS:
- Specific numbers, versions, prices
- Concrete examples and commands
- Clear, actionable steps
- Technical depth
- Builder-focused language

❌ ISSUES:
- Forbidden words: delve, leverage, robust, comprehensive, facilitate, revolutionary, game-changing, cutting-edge, synergy, paradigm, holistic, seamless
- Vague statements without specifics
- Marketing hype or fluff
- Generic advice that could apply to anything
- Missing numbers, versions, or concrete details

FEEDBACK GUIDELINES:
- Be specific about what needs to change
- Point to exact sections that need work
- Suggest concrete improvements
- If score >= 8, keep feedback minimal (article is good enough)
- If score < 8, provide detailed section-by-section fixes`;

// -------------------------------------------
// Reviewer Node Function
// -------------------------------------------

export async function reviewerNode(state: ArticleWorkflowState): Promise<NodeUpdate> {
    const { article, item, iteration } = state;

    if (!article) {
        throw new Error("No article to review");
    }

    const prompt = `Review this article for VibeCoders builders:

ORIGINAL TOPIC:
Title: ${item.title}
Summary: ${item.summary}

ARTICLE CONTENT:

## Why It Matters
${article.whyItMatters.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## When to Use
${article.whenToUse.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## How to Use
${article.howToUse.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Provide a detailed review with:
1. Score (1-10)
2. Strengths (what's working well)
3. Improvements (high-level areas to improve)
4. Specific fixes (section-by-section issues and suggestions)

Be thorough but constructive. If the article is already good (score >= 8), keep feedback minimal.`;

    try {
        console.log(`[Reviewer Node] Reviewing article (iteration ${iteration})...`);

        // Call Gemini with JSON mode
        const rawFeedback = await callGeminiJSON<ReviewFeedback>(prompt, SYSTEM_PROMPT, {
            temperature: 0.3, // Lower temperature for more consistent reviews
            maxOutputTokens: 2048,
        });

        // Validate with Zod schema
        const feedback = ReviewFeedbackSchema.parse(rawFeedback);

        console.log(`[Reviewer Node] Score: ${feedback.score}/10`);
        console.log(`[Reviewer Node] Strengths: ${feedback.strengths.length}`);
        console.log(`[Reviewer Node] Improvements: ${feedback.improvements.length}`);
        console.log(`[Reviewer Node] Specific fixes: ${feedback.specificFixes.length}`);

        // Determine if we should continue iterating
        const shouldContinue =
            feedback.score < 8 &&
            state.iteration < state.maxIterations;

        if (shouldContinue) {
            console.log(`[Reviewer Node] Score < 8, will rewrite (iteration ${state.iteration + 1}/${state.maxIterations})`);
        } else if (feedback.score >= 8) {
            console.log(`[Reviewer Node] Score >= 8, article approved!`);
        } else {
            console.log(`[Reviewer Node] Max iterations reached, accepting article`);
        }

        return {
            reviewScore: feedback.score,
            feedback,
            shouldContinue,
        };
    } catch (error) {
        // Fallback: Auto-approve if review fails
        // This prevents the entire workflow from crashing
        console.error(`[Reviewer Node] Error:`, error);
        console.warn(`[Reviewer Node] ⚠️ Auto-approving article due to review failure`);

        return {
            reviewScore: 7, // Assume decent quality
            feedback: null,
            shouldContinue: false, // Skip rewrites, finalize immediately
        };
    }
}
