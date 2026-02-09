// ===========================================
// Slack Interactions API Route
// ===========================================
// 1. Acknowledge Slack within 3 seconds
// 2. Update Notion checkbox
// 3. Trigger background function for article generation

import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/client";
import { updateProcessedItem } from "@/lib/notion/operations";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";

    console.log("[Slack Interactions] Received request");

    // Verify signature
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    if (!verifySlackRequest(signingSecret, rawBody, timestamp, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get("payload");
    if (!payloadStr) {
      return NextResponse.json({ error: "No payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    if (payload.type === "block_actions") {
      const action = payload.actions[0];
      const actionId = action.action_id as string;
      const responseUrl = payload.response_url;

      console.log("[Slack Interactions] Action:", actionId);

      if (actionId.startsWith("approve_")) {
        let valueData;
        let itemTitle = "Unknown";

        try {
          valueData = JSON.parse(action.value);
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
        } catch {
          return NextResponse.json({ ok: true });
        }

        const { notionPageId } = valueData;
        console.log(`[Slack] Approved: ${notionPageId}`);

        // Step 1: Update Notion checkbox SYNCHRONOUSLY (fast)
        try {
          await updateProcessedItem(notionPageId, { slackApproved: true });
          console.log(`[Slack] ✅ Notion checkbox updated`);
        } catch (error) {
          console.error(`[Slack] ❌ Failed to update Notion:`, error);
        }

        // Step 2: Trigger background function via fetch (don't await completion)
        const baseUrl = process.env.URL || "https://vibecoders-news.netlify.app";
        const backgroundUrl = `${baseUrl}/.netlify/functions/process-article-background`;

        console.log(`[Slack] Triggering: ${backgroundUrl}`);

        // Use fetch without await - let it run in background
        fetch(backgroundUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notionPageId,
            itemTitle,
            responseUrl, // Pass Slack response URL for updates
          }),
        }).then(res => {
          console.log(`[Slack] Background trigger response: ${res.status}`);
        }).catch(err => {
          console.error(`[Slack] Background trigger error:`, err.message);
        });

        // Step 3: Immediately return to Slack with "processing" message
        return new NextResponse(JSON.stringify({
          response_type: "in_channel",
          replace_original: true,
          text: `⏳ Processing: ${itemTitle}`,
          blocks: [{
            type: "section",
            text: {
              type: "mrkdwn",
              text: `⏳ *${itemTitle}*\n_Article generation started..._`,
            },
          }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Slack Interactions] Error:", error);
    return NextResponse.json({ ok: true });
  }
}
