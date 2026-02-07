// ===========================================
// Test Crawl API Route
// ===========================================
// Test endpoint to verify crawler without full pipeline
// Shows relevance scores and filtering

import { NextResponse } from "next/server";
import { crawlAllSources, getSourcesStats, getKeywordStats } from "@/lib/crawlers";

export async function GET() {
  try {
    console.log("\n[Test Crawl] Starting crawlers...\n");

    // Get source configuration
    const sourceStats = getSourcesStats();
    const keywordStats = getKeywordStats();

    console.log("[Test Crawl] Sources:", JSON.stringify(sourceStats));

    // Run crawlers with new relevance filtering
    const result = await crawlAllSources({
      hoursBack: 48, // Look back further for testing
      minRelevanceScore: 20, // Lower threshold for testing
      maxTotalItems: 20,
    });

    const { items, stats } = result;

    console.log(`[Test Crawl] Found ${items.length} relevant items`);

    // Format preview with relevance details
    const preview = items.slice(0, 15).map((item) => ({
      title: item.title,
      source: item.source,
      url: item.url,
      relevanceScore: item.relevanceScore,
      matches: item.relevanceDetails ? {
        tier1: item.relevanceDetails.tier1Matches.slice(0, 3),
        tier2: item.relevanceDetails.tier2Matches.slice(0, 3),
        negative: item.relevanceDetails.negativeMatches,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      config: {
        sources: sourceStats,
        keywords: keywordStats,
      },
      stats: stats.totals,
      timing: {
        durationMs: stats.timing.durationMs,
      },
      items: {
        total: items.length,
        preview,
      },
    });
  } catch (error) {
    console.error("[Test Crawl] Error:", error);
    return NextResponse.json(
      { error: "Crawl failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
