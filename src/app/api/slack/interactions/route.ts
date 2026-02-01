// ===========================================
// Slack Interactions API Route
// ===========================================
// Handles button clicks from Slack messages

import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/client";
import { updateApprovalMessage } from "@/lib/slack/messages";
import { updateProcessedItem, getApprovedItemsForWriting } from "@/lib/notion/operations";
import { writeArticle } from "@/lib/agents/writer";
import { reviewArticle } from "@/lib/agents/reviewer";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";

    console.log("[Slack Interactions] Received request");

    // Verify request signature
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("[Slack] SLACK_SIGNING_SECRET not set");
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }
    
    if (!verifySlackRequest(signingSecret, rawBody, timestamp, signature)) {
      console.error("[Slack] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the payload (URL encoded)
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get("payload");
    if (!payloadStr) {
      console.error("[Slack] No payload in request");
      return NextResponse.json({ error: "No payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    console.log("[Slack Interactions] Payload type:", payload.type);
    
    // Handle different interaction types
    if (payload.type === "block_actions") {
      const action = payload.actions[0];
      const actionId = action.action_id as string;
      const userId = payload.user.id;
      const channelId = payload.channel.id;
      const messageTs = payload.message.ts;

      console.log("[Slack Interactions] Action:", actionId);

      // Handle approve/reject actions
      if (actionId.startsWith("approve_") || actionId.startsWith("reject_")) {
        const approved = actionId.startsWith("approve_");
        
        let valueData;
        try {
          valueData = JSON.parse(action.value);
        } catch (e) {
          console.error("[Slack] Failed to parse action value:", action.value);
          return NextResponse.json({ ok: true }); // Still return OK to Slack
        }
        
        const { itemId, notionPageId } = valueData;
        console.log(`[Slack] ${approved ? "Approved" : "Rejected"} item ${itemId}, notionPageId: ${notionPageId}`);

        // Do the Notion update BEFORE returning to Slack
        // (Must complete within 3 seconds)
        if (approved && notionPageId) {
          try {
            console.log(`[Slack] Updating Notion page: ${notionPageId}`);
            await updateProcessedItem(notionPageId, { slackApproved: true });
            console.log(`[Slack] Notion updated successfully!`);
          } catch (notionErr) {
            console.error(`[Slack] Notion update failed:`, notionErr);
          }
        }

        // Update Slack message (non-blocking, ok if it fails)
        updateApprovalMessage(channelId, messageTs, itemId, approved, userId).catch((err) => {
          console.error(`[Slack] Message update failed:`, err);
        });

        // Return to Slack - article generation will be triggered separately
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Slack Interactions] Error:", error);
    // Return OK anyway to prevent Slack from retrying
    return NextResponse.json({ ok: true });
  }
}

// -------------------------------------------
// Background process for approved items
// -------------------------------------------

async function processApprovedItem(notionPageId: string) {
  try {
    // Get the approved item from Notion
    const items = await getApprovedItemsForWriting();
    const item = items.find((i) => i.notionPageId === notionPageId);

    if (!item) {
      console.error(`[Process] Item not found: ${notionPageId}`);
      return;
    }

    console.log(`[Process] Writing article for: ${item.title}`);

    // Write article
    const articleContent = await writeArticle(item);

    // Review article
    const reviewed = await reviewArticle(item, articleContent);

    // Update Notion with the article content
    await updateProcessedItem(notionPageId, {
      title: reviewed.title,
      articleContent: articleContent,
      reviewedContent: reviewed.content,
    });

    console.log(`[Process] Article ready for: ${reviewed.title}`);
  } catch (error) {
    console.error(`[Process] Error processing item ${notionPageId}:`, error);
  }
}
