// ===========================================
// Article Generation Workflow
// ===========================================
// LangGraph-style workflow: Writer → Reviewer → Conditional (rewrite or finalize)

import type { ProcessedItem } from "@/types";
import { GraphBuilder, executeWorkflow } from "../workflow/engine";
import { createInitialState } from "../workflow/types";
import { writerNode } from "../nodes/writer";
import { reviewerNode } from "../nodes/reviewer";
import { finalizerNode } from "../nodes/finalizer";

// -------------------------------------------
// Conditional Routing Function
// -------------------------------------------

function shouldRewrite(state: any): string {
    if (state.shouldContinue) {
        return "writer";  // Loop back for rewrite with feedback
    }
    return "finalizer";  // Done, finalize the article
}

// -------------------------------------------
// Build Workflow Graph
// -------------------------------------------

function buildArticleWorkflow() {
    return new GraphBuilder()
        // Add nodes
        .addNode("writer", writerNode)
        .addNode("reviewer", reviewerNode)
        .addNode("finalizer", finalizerNode)

        // Define edges
        .addEdge("writer", "reviewer")           // Writer → Reviewer
        .addEdge("reviewer", shouldRewrite)      // Reviewer → Conditional
        .addEdge("finalizer", "END")             // Finalizer → END

        // Set entry point
        .setEntryPoint("writer")

        .build();
}

// -------------------------------------------
// Public API: Run Article Workflow
// -------------------------------------------

export async function runArticleWorkflow(
    item: ProcessedItem,
    maxIterations: number = 2
): Promise<string> {
    console.log(`[Article Workflow] Starting for: "${item.title}"`);
    console.log(`[Article Workflow] Max iterations: ${maxIterations}`);

    // Create initial state
    const initialState = createInitialState(item, maxIterations);

    // Build and execute workflow
    const graph = buildArticleWorkflow();
    const finalState = await executeWorkflow(graph, initialState);

    // Log final results
    const duration = Date.now() - finalState.startTime;
    console.log(`[Article Workflow] Completed in ${duration}ms`);
    console.log(`[Article Workflow] Final score: ${finalState.finalScore}/10`);
    console.log(`[Article Workflow] Iterations: ${finalState.iteration}`);
    console.log(`[Article Workflow] Nodes executed:`, finalState.nodeHistory);

    return finalState.finalArticle;
}
