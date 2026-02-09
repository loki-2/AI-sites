// ===========================================
// Test: Article Workflow
// ===========================================
// Tests the new LangGraph-style workflow with writer-reviewer loop

import { NextRequest, NextResponse } from "next/server";
import { runArticleWorkflow } from "@/lib/agents/workflows/article-workflow";
import type { ProcessedItem } from "@/types";

export async function GET(request: NextRequest) {
    console.log("\n========================================");
    console.log("TESTING ARTICLE WORKFLOW");
    console.log("========================================\n");

    // Create a test item
    const testItem: ProcessedItem = {
        id: "test-workflow-001",
        notionPageId: "test-workflow-001",
        title: "Gemini 2.0 Flash Released with Multimodal Live API",
        originalUrl: "https://example.com/gemini-2-flash",
        summary: "Google releases Gemini 2.0 Flash, a faster model with native multimodal capabilities including real-time audio and video understanding. Features 1M token context window and costs $0.075 per million input tokens.",
        coverImage: undefined,
        tags: ["AI", "Google", "API"],
        category: "news",
        relevanceScore: 9.2,
        whyItMatters: "New AI model with real-time multimodal capabilities for builders",
        slackApproved: true,
        articleContent: "",
        reviewedContent: "",
        readyToPublish: false,
    };

    try {
        console.log(`Testing with: "${testItem.title}"\n`);

        const startTime = Date.now();

        // Run the workflow
        const article = await runArticleWorkflow(testItem, 2);

        const duration = Date.now() - startTime;

        console.log("\n========================================");
        console.log("WORKFLOW COMPLETED SUCCESSFULLY");
        console.log("========================================");
        console.log(`Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
        console.log(`Article length: ${article.length} chars`);
        console.log(`Word count: ${article.split(/\s+/).length} words`);
        console.log("\n========================================");
        console.log("ARTICLE PREVIEW");
        console.log("========================================\n");
        console.log(article.substring(0, 500) + "...\n");

        return NextResponse.json({
            success: true,
            duration,
            wordCount: article.split(/\s+/).length,
            articlePreview: article.substring(0, 500),
            fullArticle: article,
        });
    } catch (error) {
        console.error("\n========================================");
        console.error("WORKFLOW FAILED");
        console.error("========================================");
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message,
                stack: (error as Error).stack,
            },
            { status: 500 }
        );
    }
}
