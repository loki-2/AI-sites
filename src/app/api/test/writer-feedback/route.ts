// ===========================================
// Test Endpoint: Writer with Feedback Loop
// ===========================================
// Tests the new writer-reviewer feedback loop

import { NextRequest, NextResponse } from "next/server";
import { writeArticleWithFeedback } from "@/lib/agents/writer-with-feedback";
import type { ProcessedItem } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Test with a sample item
    const testItem: ProcessedItem = {
      id: "test-123",
      notionPageId: "test-123",
      title: "DeepSeek's New R1 Model Matches GPT-4 at 1/20th the Cost",
      originalUrl: "https://news.ycombinator.com/item?id=12345",
      summary: "DeepSeek has released R1, a new reasoning model that matches GPT-4 performance on key benchmarks while costing significantly less to run. The model is open-weights and can run locally.",
      tags: ["AI", "LLM", "Open Source"],
      category: "news" as const,
      relevanceScore: 95,
      whyItMatters: "For builders, this means access to GPT-4 level intelligence without the API costs. Great for startups building AI products.",
      slackApproved: true,
      articleContent: "",
      reviewedContent: "",
      readyToPublish: false,
    };

    console.log("[Test] Starting writer-feedback test...");
    const startTime = Date.now();

    const result = await writeArticleWithFeedback(testItem);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${(duration / 1000).toFixed(1)}s`,
      result: {
        title: result.title,
        content: result.content,
        wordCount: result.content.split(/\s+/).length,
        feedbackScore: result.finalScore,
      },
    });
  } catch (error) {
    console.error("[Test] Writer-feedback error:", error);
    return NextResponse.json(
      {
        error: "Writer-feedback test failed",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
