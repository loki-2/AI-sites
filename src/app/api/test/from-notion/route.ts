// ===========================================
// Test Agents from Notion (Skip Crawling)
// ===========================================
// Fetch from Notion Raw DB and run agents

import { NextRequest, NextResponse } from "next/server";
import { getRawItemsFromLast24Hours } from "@/lib/notion/operations";
import { aggregateItems, sortAndFilterItems } from "@/lib/agents";
import { addProcessedItem } from "@/lib/notion/operations";
import { postItemsForApproval } from "@/lib/slack/messages";

export async function GET(request: NextRequest) {
  try {
    console.log("[Test From Notion] Starting pipeline from Notion Raw DB...");

    // Step 1: Get items from Notion
    console.log("[Test From Notion] Step 1: Fetching from Notion...");
    const rawItems = await getRawItemsFromLast24Hours();
    console.log(`[Test From Notion] Found ${rawItems.length} items in Notion`);

    if (rawItems.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No items in Notion Raw DB",
      });
    }

    // Take first 10 for testing
    const testItems = rawItems.slice(0, 10);
    console.log(`[Test From Notion] Testing with ${testItems.length} items`);

    // Step 2: Aggregate
    console.log("[Test From Notion] Step 2: Aggregating...");
    const aggregatedItems = await aggregateItems(testItems);
    console.log(`[Test From Notion] Aggregated ${aggregatedItems.length} items`);

    // Step 3: Sort and filter
    console.log("[Test From Notion] Step 3: Sorting...");
    const topItems = await sortAndFilterItems(aggregatedItems, 5);
    console.log(`[Test From Notion] Top ${topItems.length} items selected`);

    // Step 4: Save to Processed DB
    console.log("[Test From Notion] Step 4: Saving to Processed DB...");
    const savedItems = [];
    for (const item of topItems) {
      const pageId = await addProcessedItem(item);
      savedItems.push({ ...item, notionPageId: pageId });
    }

    // Step 5: Post to Slack
    console.log("[Test From Notion] Step 5: Posting to Slack...");
    await postItemsForApproval(savedItems);

    return NextResponse.json({
      success: true,
      stats: {
        rawFromNotion: rawItems.length,
        tested: testItems.length,
        aggregated: aggregatedItems.length,
        topItems: topItems.length,
        savedToProcessed: savedItems.length,
      },
      topItems: topItems.map((item) => ({
        title: item.title,
        relevanceScore: item.relevanceScore,
        tags: item.tags,
      })),
    });
  } catch (error) {
    console.error("[Test From Notion] Error:", error);
    return NextResponse.json(
      { error: "Test failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
