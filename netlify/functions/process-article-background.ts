// ===========================================
// Background Function: Process Approved Article
// ===========================================
// NETLIFY BACKGROUND FUNCTION - 15 minute timeout
// Self-contained: calls Gemini directly, no API route calls
// Updates Slack via response_url when complete

import type { Handler, HandlerEvent } from "@netlify/functions";

// -------------------------------------------
// Gemini API (inline to avoid import issues)
// -------------------------------------------

interface GeminiResponse {
  text: string;
  finishReason: string;
}

async function callGemini(prompt: string, systemPrompt: string): Promise<GeminiResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood." }] },
    { role: "user", parts: [{ text: prompt }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(`Gemini error: ${JSON.stringify(data)}`);

  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    finishReason: data.candidates?.[0]?.finishReason || "UNKNOWN",
  };
}

// -------------------------------------------
// Notion API Helpers
// -------------------------------------------

async function getNotionPage(pageId: string): Promise<any> {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
    },
  });
  if (!response.ok) throw new Error(`Notion get error: ${await response.text()}`);
  return response.json();
}

async function updateNotionPage(pageId: string, articleContent: string): Promise<void> {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      properties: {
        "ArticleContent": { rich_text: [{ text: { content: articleContent.slice(0, 2000) } }] },
      },
    }),
  });
  if (!response.ok) throw new Error(`Notion update error: ${await response.text()}`);
}

// -------------------------------------------
// Article Generation (simplified writer)
// -------------------------------------------

const WRITER_SYSTEM_PROMPT = `You are a tech writer for VibeCoders - a publication for builders who use AI to ship fast.

Write in a direct, no-BS style. Be specific with numbers, versions, and examples.

STRICT RULES:
- NO forbidden words: delve, leverage, robust, comprehensive, seamless, revolutionize, game-changing
- NO marketing hype or fluff
- Every sentence must be actionable or informative

OUTPUT JSON with exactly:
{
  "whyItMatters": [5 one-sentence points about benefits],
  "whenToUse": [10 specific use case sentences],
  "howToUse": [10 actionable how-to sentences with commands/steps]
}`;

interface Article {
  whyItMatters: string[];
  whenToUse: string[];
  howToUse: string[];
}

async function generateArticle(title: string, summary: string, url: string): Promise<string> {
  const prompt = `Generate a structured article about this tool/news for builders:

Title: ${title}
URL: ${url}
Summary: ${summary}

Generate a JSON object with exactly:
- "whyItMatters": array of 5 one-sentence benefit points
- "whenToUse": array of 10 specific use case points
- "howToUse": array of 10 actionable how-to points

Focus on practical, specific, actionable information.`;

  console.log(`[Background] Calling Gemini for article generation...`);
  const { text } = await callGemini(prompt, WRITER_SYSTEM_PROMPT);

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");

  const article: Article = JSON.parse(jsonMatch[0]);

  // Format as markdown
  const markdown = `## Why It Matters
${article.whyItMatters.map(p => `- ${p}`).join("\n")}

## When to Use
${article.whenToUse.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## How to Use
${article.howToUse.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;

  return markdown;
}

// -------------------------------------------
// Slack Update Helper
// -------------------------------------------

async function updateSlack(
  responseUrl: string,
  text: string,
  blocks: unknown[]
): Promise<void> {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      response_type: "in_channel",
      replace_original: true,
      text,
      blocks,
    }),
  });
}

// -------------------------------------------
// Main Handler
// -------------------------------------------

const handler: Handler = async (event: HandlerEvent) => {
  const body = JSON.parse(event.body || "{}");
  const { notionPageId, itemTitle, responseUrl } = body;

  if (!notionPageId) {
    return { statusCode: 400, body: "Missing notionPageId" };
  }

  console.log(`[Background] ===== Starting =====`);
  console.log(`[Background] Page: ${notionPageId}`);
  console.log(`[Background] Title: ${itemTitle}`);

  const startTime = Date.now();

  try {
    // Step 1: Get item from Notion
    console.log(`[Background] Step 1: Fetching from Notion...`);
    const page = await getNotionPage(notionPageId);
    const props = page.properties;

    const title = props.Title?.title?.[0]?.text?.content || itemTitle || "Unknown";
    const summary = props.Summary?.rich_text?.[0]?.text?.content || "";
    const url = props.OriginalURL?.url || "";

    console.log(`[Background] Title: ${title}`);

    // Step 2: Generate article
    console.log(`[Background] Step 2: Generating article...`);
    const articleContent = await generateArticle(title, summary, url);
    const wordCount = articleContent.split(/\s+/).length;

    console.log(`[Background] ✅ Generated: ${wordCount} words`);

    // Step 3: Save to Notion
    console.log(`[Background] Step 3: Saving to Notion...`);
    await updateNotionPage(notionPageId, articleContent);
    console.log(`[Background] ✅ Saved to Notion`);

    // Step 4: Update Slack
    if (responseUrl) {
      console.log(`[Background] Step 4: Updating Slack...`);
      await updateSlack(responseUrl, `✅ Article ready: ${title}`, [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *${title}*\n_Article generated! (${wordCount} words)_`,
        },
      }]);
      console.log(`[Background] ✅ Slack updated`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Background] ===== Done in ${duration}ms =====`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, wordCount, duration }),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Background] ❌ Error after ${duration}ms:`, error);

    // Update Slack with failure
    if (responseUrl) {
      await updateSlack(responseUrl, `❌ Failed: ${itemTitle}`, [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `❌ *${itemTitle}*\n_Failed: ${(error as Error).message}_`,
        },
      }]);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

export { handler };
