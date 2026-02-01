# VibeCoders News - Testing Guide

## Current Workflow (V2 - Simplified)

```
Smart Crawlers (~50 items)
    ↓
Headline Writer Agent
    ↓
Slack Bot (Approve/Reject)
    ↓
Human Approves 5-10 items
    ↓
Writer Agent
    ↓
Reviewer Agent
    ↓
Publish to Website
```

## Quick Start Testing

### 1. Make Sure Server is Running

```bash
# Check if server is running
curl http://localhost:3000/api/test/crawl

# If not on port 3000, try 3001
curl http://localhost:3001/api/test/crawl
```

### 2. Test Individual Components

#### A. Test LLM Connection (Gemini 2.5 Flash)
```bash
curl http://localhost:3000/api/test/llm
```

**Expected**: 
```json
{
  "success": true,
  "response": "Hello! ... (some response)",
  "model": "gemini-2.5-flash"
}
```

**If it fails**: Check your `GOOGLE_API_KEY` and rate limits

#### B. Test Simple Headline Generation
```bash
curl http://localhost:3000/api/test/headline-simple
```

**Expected**: A single headline generated from a test item

#### C. Test Crawlers (Smart Filtering)
```bash
curl http://localhost:3000/api/test/crawl
```

**Expected**: ~20-50 items from HackerNews, RSS feeds, and Reddit
- HackerNews: 100+ score, max 20 items
- RSS: Max 15 per feed
- Reddit: 10+ upvotes, max 15 items

#### D. Test Full Headline Pipeline (10 items)
```bash
curl http://localhost:3000/api/test/headline-test
```

**Expected**: 10 headlines with catchy titles, summaries, tags
**Time**: ~1-2 minutes

### 3. Test Full Simplified Pipeline

This runs the complete flow: Crawl → Headlines → Post to Slack

```bash
curl -X POST http://localhost:3000/api/cron/crawl-simple \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"
```

**What it does**:
1. Crawls ~50 items (10-15 seconds)
2. Generates headlines with AI (1-2 minutes)
3. Saves to Notion Processed DB
4. Posts to Slack with Approve/Reject buttons

**Expected Slack Message**:
```
📰 New Headlines Ready for Review! (50 items)

1. Claude now supports 1M tokens - build complex apps in one prompt
   Tags: AI, Claude, Coding
   [Approve] [Reject]

2. Show HN: I built a SaaS in 48 hours with Cursor + Claude
   Tags: Indie Hacking, AI Tools
   [Approve] [Reject]

... (more items)
```

### 4. Approve Items in Slack

1. Go to your Slack channel
2. Click **[Approve]** on 5-10 headlines you like
3. Each approval will:
   - Update Notion: `SlackApproved = true`
   - Trigger Writer Agent
   - Trigger Reviewer Agent
   - Save full article to Processed DB

### 5. Check Notion

**Processed Items Database** should show:
- `SlackApproved = true` for items you approved
- `ReviewedContent` with 150-250 word article
- `ReviewedTitle` with polished headline

### 6. Mark Ready to Publish

In Notion Processed DB:
1. Review the articles
2. Set `ReadyToPublish = true` for ones you want to publish

### 7. Publish to Website

```bash
curl -X POST http://localhost:3000/api/cron/publish \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"
```

**What it does**:
1. Finds items with `ReadyToPublish = true`
2. Publishes to Supabase
3. Moves to Notion Published DB
4. Articles appear on website

### 8. View on Website

```bash
open http://localhost:3000
```

Your published articles should appear on the homepage!

## Troubleshooting

### LLM Test Fails (Timeout or 429)

**Problem**: Gemini API rate limits or timeouts

**Solutions**:
1. Check rate limits: https://aistudio.google.com/app/apikey
2. Wait 60 seconds and try again
3. Switch to OpenAI:
   ```bash
   # In .env.local
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your_key_here
   ```

### Headline Test Returns 0 Headlines

**Problem**: LLM calls are failing silently

**Check server logs**:
```bash
# Find your terminal
ls -lrt ~/.cursor/projects/Users-abhishekedla-Documents-vibecodersnews/terminals/

# Check the most recent .txt file
tail -f ~/.cursor/projects/.../terminals/XXXXX.txt
```

Look for errors like:
- `404 Not Found` → Model name is wrong
- `429 Too Many Requests` → Rate limit exceeded
- Timeout → API is slow, try fewer items

### Slack Bot Not Working

**Problem**: Wrong token or URL not configured

**Fix**:
1. Get Bot User OAuth Token (starts with `xoxb-`):
   - Go to https://api.slack.com/apps
   - Select your app → OAuth & Permissions
   - Copy "Bot User OAuth Token"
   
2. Update `.env.local`:
   ```
   SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
   ```

3. Configure Slack URLs:
   - Interactivity: `https://your-app.netlify.app/api/slack/interactions`
   - Events: `https://your-app.netlify.app/api/slack/events`

### No Items from Crawlers

**Problem**: Filters are too strict or no recent posts

**Solutions**:
1. Lower the score thresholds in crawler files
2. Increase time window from 24h to 48h
3. Check if sources are up (HN, Reddit, RSS feeds)

## Quick Reference

### API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/test/llm` | GET | Test LLM connection | None |
| `/api/test/crawl` | GET | Test crawlers | None |
| `/api/test/headline-simple` | GET | Test 1 headline | None |
| `/api/test/headline-test` | GET | Test 10 headlines | None |
| `/api/cron/crawl-simple` | POST | Full crawl+headline pipeline | Bearer token |
| `/api/cron/publish` | POST | Publish approved articles | Bearer token |
| `/api/slack/interactions` | POST | Handle Slack button clicks | Slack signature |

### Environment Variables

```bash
# LLM
GOOGLE_API_KEY=AIzaSy...
LLM_PROVIDER=gemini  # or openai

# Notion
NOTION_API_KEY=ntn_...
NOTION_RAW_DB_ID=...
NOTION_PROCESSED_DB_ID=...
NOTION_PUBLISHED_DB_ID=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Slack
SLACK_BOT_TOKEN=xoxb-...  # Must start with xoxb-
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=...

# Security
CRON_SECRET=vibecoders-cron-secret-2024
```

## What Changed from V1

✅ **Removed**:
- Aggregation Agent (replaced with smarter crawlers)
- Sorting Agent (filtering done at source)

✅ **Added**:
- Headline Writer Agent (creates catchy, builder-focused headlines)
- Smart filtering in crawlers (only high-quality items)

✅ **Benefits**:
- 10x faster (5 LLM calls instead of 50+)
- Better quality (human approves headlines, not raw titles)
- Cheaper (less API usage)

## Next Steps After Testing

1. ✅ Verify all tests pass locally
2. Push to GitHub
3. Deploy to Netlify
4. Configure Netlify environment variables
5. Update Slack webhook URLs to production
6. Test on production
7. Set up scheduled functions (cron)
