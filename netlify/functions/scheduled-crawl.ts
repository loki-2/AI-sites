// ===========================================
// Netlify Scheduled Function: Crawl Pipeline
// ===========================================
// Runs at 11am and 11:30pm daily to crawl news sources

import type { Config, Context } from "@netlify/functions";

export default async function handler(request: Request, context: Context) {
  console.log("[Scheduled Crawl] Function triggered");

  // Get the base URL from environment or request
  const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET || "";

  try {
    // Call the simplified crawl API
    const response = await fetch(`${baseUrl}/api/cron/crawl-simple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Scheduled Crawl] API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Crawl API failed", status: response.status }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("[Scheduled Crawl] Completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Scheduled Crawl] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Schedule: 11am and 11:30pm UTC daily
// Adjust the hours based on your timezone
export const config: Config = {
  schedule: "0 11,23 * * *",
};
