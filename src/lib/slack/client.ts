// ===========================================
// Slack Client Configuration
// ===========================================

import { WebClient } from "@slack/web-api";

// Initialize Slack Web Client
export const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Channel ID from environment
export const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID!;

// -------------------------------------------
// Validate Slack configuration
// -------------------------------------------

export function validateSlackConfig(): boolean {
  const required = ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_CHANNEL_ID"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing Slack config: ${missing.join(", ")}`);
    return false;
  }

  return true;
}

// -------------------------------------------
// Verify Slack request signature
// -------------------------------------------

import crypto from "crypto";

export function verifySlackRequest(
  signingSecret: string,
  requestBody: string,
  timestamp: string,
  signature: string
): boolean {
  // Check if timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Create the signature base string
  const sigBaseString = `v0:${timestamp}:${requestBody}`;

  // Create HMAC SHA256
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBaseString)
      .digest("hex");

  // Compare signatures using timing-safe comparison.
  // Must check lengths first — timingSafeEqual throws if lengths differ.
  if (Buffer.byteLength(mySignature) !== Buffer.byteLength(signature)) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}
