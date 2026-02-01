// ===========================================
// Test Headline Writer (Small Sample)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { crawlAllSources } from "@/lib/crawlers";
import { generateHeadlines } from "@/lib/agents/headline";

export async function GET(request: NextRequest) {
  try {
    console.log("[Headline Test] Starting test...");

    // Step 1: Crawl (limit to 10 for testing)
    console.log("[Headline Test] Step 1: Crawling...");
    const rawItems = await crawlAllSources({ hoursBack: 24 });
    const testItems = rawItems.slice(0, 10);
    console.log(`[Headline Test] Using ${testItems.length} items for testing`);

    // Step 2: Generate headlines
    console.log("[Headline Test] Step 2: Generating headlines...");
    const headlines = await generateHeadlines(testItems);

    return NextResponse.json({
      success: true,
      stats: {
        crawled: rawItems.length,
        tested: testItems.length,
        headlines: headlines.length,
      },
      headlines: headlines.map((h) => ({
        headline: h.title,
        summary: h.summary,
        whyItMatters: h.whyItMatters,
        tags: h.tags,
        score: h.relevanceScore,
        url: h.originalUrl,
      })),
    });
  } catch (error) {
    console.error("[Headline Test] Error:", error);
    return NextResponse.json(
      { error: "Test failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
