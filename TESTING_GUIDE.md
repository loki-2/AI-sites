# VibeCoders News - Complete Testing Guide

## Summary of Implementation

✅ **What's been implemented:**
1. Smart crawlers (HackerNews, RSS, Reddit)
2. Headline generation agent (replaces aggregation + sorting)
3. Writer + Reviewer feedback loop (single rewrite cycle)
4. Slack bot with Approve/Reject buttons
5. Netlify Background Function for article generation (15min timeout)
6. Auto-publish every 10 minutes when ReadyToPublish is checked
7. ReviewedContent column for final articles

## Testing Steps

### 1. Test Writer-Reviewer Feedback Loop

**Local Test:**
```bash
# Start dev server
npm run dev

# Test the feedback loop (takes ~30-60s)
curl http://localhost:3000/api/test/writer-feedback | jq .
```

**Expected Output:**
```json
{
  "success": true,
  "duration": "35s",
  "result": {
    "title": "Improved Title Here",
    "content": "150-250 word article...",
    "wordCount": 180,
    "feedbackScore": 8.5
  }
}
```

### 2. Test Crawl + Headline Generation (Local Only)

**Note:** This takes 2-3 minutes, so it will timeout on Netlify. Run locally:

```bash
# Clear Notion Processed DB first (optional - to avoid duplicates)

curl -X POST http://localhost:3000/api/cron/crawl-simple \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"
```

**Expected Output:**
```json
{
  "success": true,
  "stats": {
    "crawled": 20,
    "headlines": 12,
    "duration": "120s"
  }
}
```

**What happens:**
- Crawls HackerNews, RSS feeds, Reddit
- Generates catchy headlines for each item
- Saves to Notion Processed DB
- Posts to Slack with Approve/Reject buttons

### 3. Test Slack Approval → Article Generation (Production)

**Deploy first:**
```bash
git add .
git commit -m "Add writer-reviewer feedback loop and auto-publish"
git push
# Wait for Netlify deploy
```

**Then:**
1. Go to Slack channel
2. Click **"Approve"** on any headline
3. Check Netlify logs:
   - **Functions** tab → Find `process-article-background`
   - Should see:
     ```
     [Background] Step 1: Updating Notion checkbox...
     [Background] Notion checkbox updated!
     [Background] Step 2: Updating Slack message...
     [Background] Slack message updated!
     [Background] Step 3: Generating article...
     [Writer+Reviewer] Starting for: [Title]
     [Writer+Reviewer] Initial draft complete
     [Writer+Reviewer] Review complete: Score 7/10
     [Writer+Reviewer] Rewriting based on feedback...
     [Writer+Reviewer] Final article complete
     [Background] Article generation complete
     ```

4. Check Notion Processed DB:
   - ✅ SlackApproved checkbox
   - ✅ Article Content (filled)
   - ✅ ReviewedContent (filled - same content)
   - Title might be improved by reviewer

### 4. Test Auto-Publishing

**Steps:**
1. In Notion Processed DB, find an approved item with Article Content
2. Check the **ReadyToPublish** checkbox ✅
3. Wait up to 10 minutes (scheduled function runs every 10min)
4. Check Supabase `articles` table → new row added
5. Visit https://vibecoders-news.netlify.app → article appears on homepage
6. Notion Processed DB → ReadyToPublish checkbox gets unchecked (prevents duplicate publish)

**Manual Trigger (don't wait 10min):**
```bash
curl -X POST https://vibecoders-news.netlify.app/api/cron/publish \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"
```

### 5. Complete End-to-End Test

**Full workflow:**

1. **Crawl (local):**
   ```bash
   curl -X POST http://localhost:3000/api/cron/crawl-simple \
     -H "Authorization: Bearer vibecoders-cron-secret-2024"
   ```

2. **Approve in Slack:**
   - Click "Approve" on any headline
   - Within 30-60s: Notion checkbox checked
   - Within 2-3min: Article generated (Background function)

3. **Publish:**
   - Check ReadyToPublish in Notion
   - Wait 10min OR trigger manually:
     ```bash
     curl -X POST https://vibecoders-news.netlify.app/api/cron/publish \
       -H "Authorization: Bearer vibecoders-cron-secret-2024"
     ```

4. **Verify:**
   - Homepage: https://vibecoders-news.netlify.app
   - Article page: https://vibecoders-news.netlify.app/article/[slug]

## Troubleshooting

### Slack Approval Times Out
- **Symptom:** "Operation timed out" when clicking Approve
- **Fix:** Already implemented - returns immediately now
- **Verify:** Check Background Function logs for actual processing

### Article Not Generated
- **Check:** Netlify Functions logs → `process-article-background`
- **Common issues:**
  - Missing `NOTION_API_KEY` or `GOOGLE_API_KEY` in Netlify env vars
  - Gemini API rate limit (wait 1 min and retry)
  - Background function not enabled in Netlify

### Article Not Published
- **Check:** Scheduled function running?
  - Netlify → Functions → `scheduled-publish` should run every 10min
- **Manual check:**
  ```bash
  # Check what's ready to publish
  # (Need to add a test endpoint for this)
  ```

### Notion Columns Missing
Make sure Notion Processed DB has:
- `SlackApproved\t` (checkbox)
- `Article Content` (rich text)
- `ReviewedContent` (rich text) ← **NEW**
- `ReadyToPublish\t` (checkbox)

## Environment Variables Checklist

### Netlify Deploy Settings

Required environment variables:
```
GOOGLE_API_KEY=your_key
NOTION_API_KEY=your_key
NOTION_RAW_DB_ID=...
NOTION_PROCESSED_DB_ID=...
NOTION_PUBLISHED_DB_ID=...
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=vibecoders-cron-secret-2024
LLM_PROVIDER=gemini
```

## Performance Notes

- **Crawl + Headlines:** ~2 minutes (20 items → 12 headlines)
- **Writer-Reviewer Loop:** ~30-60 seconds per article
- **Slack Approval Response:** <1 second (immediate response)
- **Background Article Gen:** 1-3 minutes (Background Function)
- **Publish Check:** Every 10 minutes (scheduled)

## Next Steps

1. Test writer-feedback locally ✅
2. Deploy to Netlify
3. Test Slack approval → article generation
4. Test manual publish
5. Test scheduled publish (wait 10min or trigger manually)
6. Monitor Netlify Function logs for any errors

## Support

If anything fails, check:
1. **Netlify Function Logs** - see actual errors
2. **Notion API** - are all 3 DBs shared with integration?
3. **Gemini API** - rate limits?
4. **Slack** - correct bot token and permissions?
