// Test Slack connection
import { NextRequest, NextResponse } from "next/server";
import { slack, SLACK_CHANNEL_ID } from "@/lib/slack/client";
import { requireDevAuth } from "@/lib/utils/dev-auth";

export async function GET(request: NextRequest) {
  const authError = requireDevAuth(request);
  if (authError) return authError;
  try {
    console.log("[Slack Test] Testing connection...");
    console.log("[Slack Test] Channel ID:", SLACK_CHANNEL_ID);
    console.log("[Slack Test] Token set:", !!process.env.SLACK_BOT_TOKEN);

    // Try to post a simple message
    const result = await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: "🧪 Test message from VibeCoders News bot! If you see this, Slack is working correctly.",
    });

    return NextResponse.json({
      success: true,
      channelId: SLACK_CHANNEL_ID,
      messageTs: result.ts,
      message: "Test message sent successfully!",
    });
  } catch (error) {
    console.error("[Slack Test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        channelId: SLACK_CHANNEL_ID,
      },
      { status: 500 }
    );
  }
}
