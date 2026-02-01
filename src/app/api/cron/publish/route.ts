// ===========================================
// Publish Cron API Route
// ===========================================
// Publishes approved articles to Supabase and the website

import { NextRequest, NextResponse } from "next/server";
import { getItemsReadyToPublish, addPublishedItem, updateProcessedItem } from "@/lib/notion/operations";
import { insertArticle, slugExists } from "@/lib/supabase/client";
import { postNotification } from "@/lib/slack/messages";
import slugify from "slugify";

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

// Generate unique slug
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  // Check if slug exists
  let slug = baseSlug;
  let counter = 1;

  while (await slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron Publish] Starting publish pipeline...");
    const startTime = Date.now();

    // Step 1: Get items ready to publish from Notion
    console.log("[Cron Publish] Step 1: Fetching items ready to publish...");
    const items = await getItemsReadyToPublish();
    console.log(`[Cron Publish] Found ${items.length} items ready to publish`);

    if (items.length === 0) {
      console.log("[Cron Publish] No items to publish");
      return NextResponse.json({
        success: true,
        message: "No items to publish",
        stats: { published: 0 },
      });
    }

    // Step 2: Publish each item
    const published: string[] = [];
    const failed: string[] = [];

    for (const item of items) {
      try {
        // Use reviewed content, fall back to article content
        const content = item.reviewedContent || item.articleContent;
        if (!content) {
          console.warn(`[Cron Publish] No content for item: ${item.title}`);
          failed.push(item.title);
          continue;
        }

        // Generate slug
        const slug = await generateUniqueSlug(item.title);

        // Insert into Supabase
        const result = await insertArticle({
          title: item.title,
          slug,
          content,
          summary: item.summary,
          originalUrl: item.originalUrl,
          source: new URL(item.originalUrl).hostname,
          tags: item.tags,
        });

        if (!result) {
          console.error(`[Cron Publish] Failed to insert: ${item.title}`);
          failed.push(item.title);
          continue;
        }

        // Add to Notion Published DB
        await addPublishedItem(item.title, slug, content, result.id);

        // Update Processed item to mark as published
        if (item.notionPageId) {
          await updateProcessedItem(item.notionPageId, {
            readyToPublish: false, // Reset so it doesn't get published again
          });
        }

        published.push(item.title);
        console.log(`[Cron Publish] Published: ${item.title} -> /${slug}`);
      } catch (error) {
        console.error(`[Cron Publish] Error publishing "${item.title}":`, error);
        failed.push(item.title);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Cron Publish] Pipeline completed in ${duration}s`);

    // Notify on Slack
    if (published.length > 0) {
      await postNotification(
        `📰 Published ${published.length} article${published.length > 1 ? "s" : ""}:\n${published.map((t) => `• ${t}`).join("\n")}`
      );
    }

    if (failed.length > 0) {
      await postNotification(
        `⚠️ Failed to publish ${failed.length} article${failed.length > 1 ? "s" : ""}:\n${failed.map((t) => `• ${t}`).join("\n")}`
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: items.length,
        published: published.length,
        failed: failed.length,
        duration: `${duration}s`,
      },
    });
  } catch (error) {
    console.error("[Cron Publish] Error:", error);
    await postNotification(`❌ Publish failed: ${(error as Error).message}`);
    return NextResponse.json(
      { error: "Publish failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
