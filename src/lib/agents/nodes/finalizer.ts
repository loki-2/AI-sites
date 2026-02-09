// ===========================================
// Finalizer Node
// ===========================================
// Finalizes the article and prepares final output

import type { ArticleWorkflowState, NodeUpdate } from "../workflow/types";

// -------------------------------------------
// Finalizer Node Function
// -------------------------------------------

export async function finalizerNode(state: ArticleWorkflowState): Promise<NodeUpdate> {
    const { articleMarkdown, reviewScore, iteration } = state;

    console.log(`[Finalizer Node] Finalizing article`);
    console.log(`[Finalizer Node] Final score: ${reviewScore}/10`);
    console.log(`[Finalizer Node] Total iterations: ${iteration}`);
    console.log(`[Finalizer Node] Word count: ${articleMarkdown.split(/\s+/).length}`);

    return {
        finalArticle: articleMarkdown,
        finalScore: reviewScore,
    };
}
