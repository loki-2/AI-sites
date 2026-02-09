// ===========================================
// Workflow State Types & Schemas
// ===========================================
// Defines the shared state for the article generation workflow

import { z } from "zod";
import type { ProcessedItem } from "@/types";
import type { StructuredArticle } from "@/lib/blog/structure";

// -------------------------------------------
// Review Feedback Schema
// -------------------------------------------

export const ReviewFeedbackSchema = z.object({
    score: z.number().min(1).max(10),
    strengths: z.array(z.string()).min(1),
    improvements: z.array(z.string()).min(1),
    specificFixes: z.array(
        z.object({
            section: z.enum(["whyItMatters", "whenToUse", "howToUse"]),
            issue: z.string(),
            suggestion: z.string(),
        })
    ),
});

export type ReviewFeedback = z.infer<typeof ReviewFeedbackSchema>;

// -------------------------------------------
// Workflow State
// -------------------------------------------

export interface ArticleWorkflowState {
    // Input
    item: ProcessedItem;

    // Writer outputs
    article: StructuredArticle | null;
    articleMarkdown: string;

    // Reviewer outputs
    reviewScore: number;
    feedback: ReviewFeedback | null;

    // Control flow
    iteration: number;
    maxIterations: number;
    shouldContinue: boolean;

    // Final result
    finalArticle: string;
    finalScore: number;

    // Metadata
    startTime: number;
    nodeHistory: string[];
}

// -------------------------------------------
// Node Return Type
// -------------------------------------------

export type NodeUpdate = Partial<ArticleWorkflowState>;

// -------------------------------------------
// Initial State Factory
// -------------------------------------------

export function createInitialState(
    item: ProcessedItem,
    maxIterations: number = 2
): ArticleWorkflowState {
    return {
        item,
        article: null,
        articleMarkdown: "",
        reviewScore: 0,
        feedback: null,
        iteration: 0,
        maxIterations,
        shouldContinue: true,
        finalArticle: "",
        finalScore: 0,
        startTime: Date.now(),
        nodeHistory: [],
    };
}
