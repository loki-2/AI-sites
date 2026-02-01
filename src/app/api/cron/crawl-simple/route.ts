// ===========================================
// Simplified Crawl Pipeline
// ===========================================
// New workflow: Crawl → Headline Writer → Slack

import { NextRequest, NextResponse } from "next/server";
import { crawlAllSources } from "@/lib/crawlers";
import { addRawItemsBatch } from "@/lib/notion/operations";
import { generateHeadlines } from "@/lib/agents/headline";
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
    console.log("[Simple Crawl] Starting simplified pipeline...");
    const startTime = Date.now();

    // Step 1: Crawl sources (now returns ~50 items)
    console.log("[Simple Crawl] Step 1: Crawling sources...");
    const rawItems = await crawlAllSources({ hoursBack: 24 });
    console.log(`[Simple Crawl] Crawled ${rawItems.length} items`);

    if (rawItems.length === 0) {
      await postNotification("⚠️ Crawl completed but found no new items.");
      return NextResponse.json({
        success: true,
        message: "No items found",
        stats: { crawled: 0 },
      });
    }

    // Step 2: Save to Notion Raw DB
    console.log("[Simple Crawl] Step 2: Saving to Notion...");
    await addRawItemsBatch(rawItems);

    // Step 3: Generate headlines with AI
    console.log("[Simple Crawl] Step 3: Generating headlines...");
    const headlineItems = await generateHeadlines(rawItems);
    console.log(`[Simple Crawl] Generated ${headlineItems.length} headlines`);

    if (headlineItems.length === 0) {
      await postNotification("⚠️ No headlines generated from crawled items.");
      return NextResponse.json({
        success: true,
        message: "No headlines generated",
        stats: { crawled: rawItems.length, headlines: 0 },
      });
    }

    // Step 4: Save to Processed DB
    console.log("[Simple Crawl] Step 4: Saving processed items...");
    const savedItems = [];
    for (const item of headlineItems) {
      const pageId = await addProcessedItem(item);
      savedItems.push({ ...item, notionPageId: pageId });
    }

    // Step 5: Post to Slack for approval
    console.log("[Simple Crawl] Step 5: Posting to Slack...");
    await postItemsForApproval(savedItems);

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Simple Crawl] Pipeline completed in ${duration}s`);

    await postNotification(
      `✅ New headlines ready for review!\n• ${rawItems.length} items crawled\n• ${headlineItems.length} headlines generated\n• Check Slack to approve your favorites`
    );

    return NextResponse.json({
      success: true,
      stats: {
        crawled: rawItems.length,
        headlines: headlineItems.length,
        duration: `${duration}s`,
      },
    });
  } catch (error) {
    console.error("[Simple Crawl] Error:", error);
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
