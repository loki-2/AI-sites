// ===========================================
// Test Agents API Route (No Notion/Slack)
// ===========================================
// Test the full AI pipeline without external services

import { NextRequest, NextResponse } from "next/server";
import { crawlAllSources } from "@/lib/crawlers";
import { aggregateItems, sortAndFilterItems } from "@/lib/agents";

export async function GET(request: NextRequest) {
  try {
    console.log("[Test Agents] Starting full pipeline test...");

    // Step 1: Crawl (limit to speed up testing)
    console.log("[Test Agents] Step 1: Crawling...");
    const rawItems = await crawlAllSources({ hoursBack: 24 });
    console.log(`[Test Agents] Crawled ${rawItems.length} items`);

    // Take only first 20 items for faster testing
    const testItems = rawItems.slice(0, 20);

    // Step 2: Aggregate
    console.log("[Test Agents] Step 2: Aggregating...");
    const aggregatedItems = await aggregateItems(testItems);
    console.log(`[Test Agents] Aggregated ${aggregatedItems.length} items`);

    // Step 3: Sort and filter
    console.log("[Test Agents] Step 3: Sorting...");
    const topItems = await sortAndFilterItems(aggregatedItems, 10);
    console.log(`[Test Agents] Top ${topItems.length} items selected`);

    return NextResponse.json({
      success: true,
      stats: {
        crawled: rawItems.length,
        tested: testItems.length,
        aggregated: aggregatedItems.length,
        topItems: topItems.length,
      },
      topItems: topItems.map((item) => ({
        title: item.title,
        summary: item.summary,
        whyItMatters: item.whyItMatters,
        tags: item.tags,
        relevanceScore: item.relevanceScore,
        url: item.originalUrl,
      })),
    });
  } catch (error) {
    console.error("[Test Agents] Error:", error);
    return NextResponse.json(
      { error: "Agent test failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
