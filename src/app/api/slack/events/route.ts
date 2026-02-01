// ===========================================
// Slack Events API Route
// ===========================================
// Handles Slack event subscriptions (URL verification, etc.)

import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/client";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    console.log("[Slack Events] Received request, body length:", rawBody.length);
    
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";

    // Parse body to check event type
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log("[Slack Events] Request type:", body.type);
    } catch (parseError) {
      console.error("[Slack Events] JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Handle URL verification challenge (no signature check needed)
    if (body.type === "url_verification") {
      console.log("[Slack Events] URL verification - Challenge:", body.challenge);
      // Return plain JSON response with just the challenge
      return new NextResponse(
        JSON.stringify({ challenge: body.challenge }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Verify request signature for other events
    const signingSecret = process.env.SLACK_SIGNING_SECRET!;
    if (!verifySlackRequest(signingSecret, rawBody, timestamp, signature)) {
      console.error("[Slack Events] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Handle event callbacks
    if (body.type === "event_callback") {
      const event = body.event;
      console.log(`[Slack Events] Received event: ${event.type}`);

      // Handle specific events here if needed
      // For now, we're primarily using interactions (button clicks)
      
      switch (event.type) {
        case "app_mention":
          // Bot was mentioned
          console.log(`[Slack Events] Bot mentioned by ${event.user}`);
          break;

        case "reaction_added":
          // Could use reactions as alternative to buttons
          console.log(`[Slack Events] Reaction ${event.reaction} added`);
          break;

        default:
          console.log(`[Slack Events] Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Slack Events] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
