// ===========================================
// Test Crawl API Route (No Notion/Slack)
// ===========================================
// Simple endpoint to test crawlers without full pipeline

import { NextRequest, NextResponse } from "next/server";
import { crawlAllSources } from "@/lib/crawlers";

export async function GET(request: NextRequest) {
  try {
    console.log("[Test Crawl] Starting crawlers...");

    // Just run crawlers and return results
    const rawItems = await crawlAllSources({ hoursBack: 24 });

    console.log(`[Test Crawl] Found ${rawItems.length} items`);

    // Return first 10 items as preview
    return NextResponse.json({
      success: true,
      total: rawItems.length,
      preview: rawItems.slice(0, 10).map((item) => ({
        title: item.title,
        source: item.source,
        url: item.url,
        score: item.score,
      })),
    });
  } catch (error) {
    console.error("[Test Crawl] Error:", error);
    return NextResponse.json(
      { error: "Crawl failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
