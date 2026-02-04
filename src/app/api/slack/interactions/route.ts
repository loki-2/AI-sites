// ===========================================
// Slack Interactions API Route
// ===========================================
// Handles button clicks from Slack messages
// On approval: updates Notion and triggers background function

import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/client";
import { updateApprovalMessage } from "@/lib/slack/messages";
import { updateProcessedItem } from "@/lib/notion/operations";

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
        let itemTitle = "Unknown";
        try {
          valueData = JSON.parse(action.value);
          // Try to extract title from the original message
          const blocks = payload.message?.blocks || [];
          for (const block of blocks) {
            if (block.type === "section" && block.text?.text) {
              const match = block.text.text.match(/\*([^*]+)\*/);
              if (match) {
                itemTitle = match[1];
                break;
              }
            }
          }
        } catch (e) {
          console.error("[Slack] Failed to parse action value:", action.value);
          return NextResponse.json({ ok: true }); // Still return OK to Slack
        }
        
        const { itemId, notionPageId } = valueData;
        console.log(`[Slack] ${approved ? "Approved" : "Rejected"} item ${itemId}, notionPageId: ${notionPageId}`);

        // IMPORTANT: Return to Slack IMMEDIATELY (must be < 3 seconds)
        // All async work happens after we return
        
        if (approved && notionPageId) {
          // Fire and forget - don't await anything
          processApproval(notionPageId, itemTitle, channelId, messageTs, itemId, userId);
        } else {
          // Just update the message for rejections
          updateApprovalMessage(channelId, messageTs, itemId, approved, userId).catch(() => {});
        }

        // Return immediately to Slack
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Slack Interactions] Error:", error);
    return NextResponse.json({ ok: true });
  }
}

// -------------------------------------------
// Process Approval (runs after response sent)
// -------------------------------------------

function processApproval(
  notionPageId: string,
  itemTitle: string,
  channelId: string,
  messageTs: string,
  itemId: string,
  userId: string
) {
  // This runs asynchronously after Slack gets its response
  (async () => {
    try {
      // 1. Update Notion
      console.log(`[Slack Async] Updating Notion: ${notionPageId}`);
      await updateProcessedItem(notionPageId, { slackApproved: true });
      console.log(`[Slack Async] Notion updated!`);

      // 2. Update Slack message
      await updateApprovalMessage(channelId, messageTs, itemId, true, userId);
      console.log(`[Slack Async] Message updated!`);

      // 3. Trigger background function for article generation
      await triggerBackgroundProcessing(notionPageId, itemTitle);
      console.log(`[Slack Async] Background function triggered!`);
    } catch (error) {
      console.error(`[Slack Async] Error:`, error);
    }
  })();
}

// -------------------------------------------
// Trigger Background Function
// -------------------------------------------

async function triggerBackgroundProcessing(notionPageId: string, itemTitle: string) {
  const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || "https://vibecoders-news.netlify.app";
  
  // Netlify background functions are triggered by calling /.netlify/functions/{name}-background
  const backgroundUrl = `${baseUrl}/.netlify/functions/process-article-background`;
  
  console.log(`[Slack] Triggering background function: ${backgroundUrl}`);
  
  const response = await fetch(backgroundUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notionPageId, itemTitle }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`[Slack] Background function error (${response.status}):`, text);
  } else {
    console.log(`[Slack] Background function triggered successfully`);
  }
}
