# VibeCoders News - Simplified Workflow V2

## New Pipeline (Faster & More Efficient)

```
Smart Crawlers (~50 items)
    ↓
Headline Writer Agent (AI generates catchy headlines)
    ↓
Slack Bot (Post for approval)
    ↓
Human Approval (5-10 items)
    ↓
Writer Agent (Generate 150-250 word article)
    ↓
Reviewer Agent (Polish & improve)
    ↓
Notion Processed DB (Mark ReadyToPublish)
    ↓
Human Final Check
    ↓
Publish to Supabase & Website
```

## What Changed

### 1. **Smarter Crawlers** (50 items instead of 200+)
- **HackerNews**: Only stories with 100+ points (was 50+), max 20 items
- **RSS Feeds**: Max 15 items per feed (was 50)
- **Reddit**: Min 10 upvotes, max 15 items (was 100)
- **Total**: ~50 high-quality items instead of 200+

### 2. **Removed Agents**
- ❌ Aggregation Agent (deduplication now in crawlers)
- ❌ Sorting Agent (already filtered by crawlers)

### 3. **New Agent**
- ✅ **Headline Writer Agent**: Transforms raw titles into compelling, builder-focused headlines
  - Creates catchy headlines (max 80 chars)
  - One-line summary
  - Why it matters for builders
  - Auto-tags content

### 4. **Benefits**
- ⚡ **Faster**: ~5 LLM calls instead of 50+
- 💰 **Cheaper**: Less API usage
- 🎯 **Better Quality**: Human approval on headlines, not raw titles
- 🚀 **More Efficient**: Focus on what matters

## API Endpoints

### Test Headline Writer
```bash
curl http://localhost:3000/api/test/headline-test
```

### Run Full Simplified Pipeline
```bash
curl -X POST http://localhost:3000/api/cron/crawl-simple \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Scheduled Times

- **11:00 AM UTC**: Morning crawl
- **11:30 PM UTC**: Evening crawl
- **12:00 PM UTC**: Auto-publish approved articles

## Manual Testing Steps

1. **Test Crawlers**:
   ```bash
   curl http://localhost:3000/api/test/crawl
   ```

2. **Test Headline Writer**:
   ```bash
   curl http://localhost:3000/api/test/headline-test
   ```

3. **Run Full Pipeline**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/crawl-simple \
     -H "Authorization: Bearer vibecoders-cron-secret-2024"
   ```

4. **Check Slack**: You should see ~50 headlines posted with Approve/Reject buttons

5. **Approve Items**: Click approve on 5-10 headlines you like

6. **Check Notion Processed DB**: Approved items will have `SlackApproved = true`

7. **Writer/Reviewer**: These run automatically when you approve in Slack

8. **Final Review**: In Notion, check the `ReviewedContent` and mark `ReadyToPublish = true`

9. **Publish**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/publish \
     -H "Authorization: Bearer vibecoders-cron-secret-2024"
   ```

## Expected Results

- **Crawl**: ~50 items in 10-15 seconds
- **Headlines**: ~50 headlines in 1-2 minutes
- **Slack Post**: All headlines posted in 2-3 messages
- **Approval**: Instant (when you click)
- **Writer/Reviewer**: 30-60 seconds per approved item
- **Total Time**: 3-5 minutes from crawl to ready for publish
