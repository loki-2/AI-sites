// ===========================================
// Crawl Cron API Route
// ===========================================
// Manually trigger the crawl pipeline (also used by Netlify scheduled function)

import { NextRequest, NextResponse } from "next/server";
import { crawlAllSources } from "@/lib/crawlers";
import { addRawItemsBatch, getRawItemsFromLast24Hours } from "@/lib/notion/operations";
import { aggregateItems, sortAndFilterItems } from "@/lib/agents";
import { addProcessedItem } from "@/lib/notion/operations";
import { postItemsForApproval, postNotification } from "@/lib/slack/messages";

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("[Cron] CRON_SECRET not set, allowing request");
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron Crawl] Starting crawl pipeline...");
    const startTime = Date.now();

    // Step 1: Crawl all sources
    console.log("[Cron Crawl] Step 1: Crawling sources...");
    const crawlResult = await crawlAllSources({ hoursBack: 24 });
    const rawItems = crawlResult.items;
    console.log(`[Cron Crawl] Crawled ${rawItems.length} raw items`);

    if (rawItems.length === 0) {
      await postNotification("⚠️ Crawl completed but found no new items.");
      return NextResponse.json({
        success: true,
        message: "No items found",
        stats: { crawled: 0 },
      });
    }

    // Step 2: Save to Notion Raw DB
    console.log("[Cron Crawl] Step 2: Saving to Notion...");
    await addRawItemsBatch(rawItems);
    console.log(`[Cron Crawl] Saved ${rawItems.length} items to Notion`);

    // Step 3: Aggregate items
    console.log("[Cron Crawl] Step 3: Aggregating items...");
    const aggregatedItems = await aggregateItems(rawItems);
    console.log(`[Cron Crawl] Aggregated ${aggregatedItems.length} items`);

    // Step 4: Sort and filter to top 50
    console.log("[Cron Crawl] Step 4: Sorting and filtering...");
    const topItems = await sortAndFilterItems(aggregatedItems, 50);
    console.log(`[Cron Crawl] Selected top ${topItems.length} items`);

    // Step 5: Save processed items to Notion
    console.log("[Cron Crawl] Step 5: Saving processed items...");
    const savedItems = [];
    for (const item of topItems) {
      const pageId = await addProcessedItem(item);
      savedItems.push({ ...item, notionPageId: pageId });
    }

    // Step 6: Post to Slack for approval
    console.log("[Cron Crawl] Step 6: Posting to Slack...");
    await postItemsForApproval(savedItems);

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Cron Crawl] Pipeline completed in ${duration}s`);

    await postNotification(
      `✅ Crawl completed in ${duration}s\n• ${rawItems.length} items crawled\n• ${topItems.length} items ready for review`
    );

    return NextResponse.json({
      success: true,
      stats: {
        crawled: rawItems.length,
        aggregated: aggregatedItems.length,
        topItems: topItems.length,
        duration: `${duration}s`,
      },
    });
  } catch (error) {
    console.error("[Cron Crawl] Error:", error);
    await postNotification(`❌ Crawl failed: ${(error as Error).message}`);
    return NextResponse.json(
      { error: "Crawl failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
