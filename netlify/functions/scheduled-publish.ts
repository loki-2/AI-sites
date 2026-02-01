// ===========================================
// Netlify Scheduled Function: Publish Pipeline
// ===========================================
// Runs daily to publish approved articles

import type { Config, Context } from "@netlify/functions";

export default async function handler(request: Request, context: Context) {
  console.log("[Scheduled Publish] Function triggered");

  // Get the base URL from environment or request
  const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET || "";

  try {
    // Call the internal publish API
    const response = await fetch(`${baseUrl}/api/cron/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Scheduled Publish] API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Publish API failed", status: response.status }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("[Scheduled Publish] Completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Scheduled Publish] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Schedule: Daily at noon UTC
export const config: Config = {
  schedule: "0 12 * * *",
};
