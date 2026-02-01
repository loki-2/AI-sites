# VibeCoders News - Current Status

## ✅ What's Complete

### Infrastructure
- ✅ Next.js 15 with TypeScript, Tailwind CSS
- ✅ shadcn/ui components with sharp edges
- ✅ Netlify configuration for deployment
- ✅ Environment variables configured

### Database & Services
- ✅ Supabase: `articles` table created
- ✅ Notion: 3 databases (Raw, Processed, Published) with properties
- ✅ Slack: Bot created (needs correct token)

### Crawlers (Working ✓)
- ✅ HackerNews API crawler
- ✅ RSS feed crawler (TechCrunch, OpenAI, Anthropic)
- ✅ Reddit JSON crawler
- ✅ Smart filtering (min scores, relevant keywords)
- ✅ **Tested**: Found 19-50 items in tests

### AI Agents
- ✅ Headline Writer Agent (code complete)
- ✅ Writer Agent (150-250 words, builder-focused)
- ✅ Reviewer Agent (polish, remove fluff)
- ✅ LLM Provider abstraction (Gemini/OpenAI)

### Slack Bot
- ✅ Interactive message builder (Approve/Reject buttons)
- ✅ Event handler (`/api/slack/events`)
- ✅ Interaction handler (`/api/slack/interactions`)
- ✅ Auto-triggers Writer/Reviewer on approval

### API Endpoints
- ✅ `/api/cron/crawl-simple` - New simplified pipeline
- ✅ `/api/cron/publish` - Publish approved articles
- ✅ `/api/slack/events` - Slack events
- ✅ `/api/slack/interactions` - Button clicks
- ✅ `/api/test/*` - Multiple test endpoints

### Frontend
- ✅ Homepage with article feed
- ✅ Article detail pages
- ✅ TechCrunch-style design
- ✅ Responsive layout
- ✅ Loading skeletons

### Scheduled Functions
- ✅ Netlify scheduled functions configured
- ✅ Crawl: 11am & 11:30pm UTC
- ✅ Publish: 12pm UTC

## ⚠️ Known Issues

### 1. Gemini API Calls Timing Out
**Problem**: Headline writer and other AI agents timeout when making Gemini API calls.

**Possible Causes**:
- Model name might be incorrect for your API key
- API rate limits
- Network latency

**Solutions to Try**:
1. Verify your Gemini API key works:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
   ```

2. Try a different model:
   - Current: `gemini-2.5-flash`
   - Alternatives: `gemini-2.0-flash`, `gemini-1.5-flash`

3. Use OpenAI instead:
   - Set `LLM_PROVIDER=openai` in `.env.local`
   - Add your `OPENAI_API_KEY`

### 2. Slack Bot Token
**Problem**: Token starts with `xapp-` (app-level token)

**Solution**: Get Bot User OAuth Token (starts with `xoxb-`)
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Select your app → OAuth & Permissions
3. Copy "Bot User OAuth Token"
4. Update `SLACK_BOT_TOKEN` in `.env.local`

## 🧪 Manual Testing

### Test Crawlers Only
```bash
curl http://localhost:3000/api/test/crawl
```
**Expected**: ~50 items with relevance filtering

### Test LLM Connection
```bash
curl http://localhost:3000/api/test/llm
```
**Expected**: `{"success":true,"response":"Hello, LLM is working!"}`

### Test Notion Connection
```bash
curl http://localhost:3000/api/test/notion
```
**Expected**: All 3 databases with their properties listed

### Full Simplified Pipeline (When LLM works)
```bash
curl -X POST http://localhost:3000/api/cron/crawl-simple \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"
```
**Expected**: 
1. Crawls ~50 items
2. Generates headlines
3. Posts to Slack
4. Ready for approval

## 📋 Workflow V2 (New & Improved)

```
1. Crawlers (smart filtering) → ~50 items
2. Headline Writer Agent → Catchy headlines
3. Slack Bot → Post with Approve/Reject buttons
4. Human approves 5-10 items
5. Writer Agent → 150-250 word article
6. Reviewer Agent → Polish & improve
7. Human marks ReadyToPublish in Notion
8. Publish Cron → Website
```

## 🔧 Next Steps

1. **Fix Gemini API Issue**:
   - Test API key directly
   - Try different model
   - Or switch to OpenAI

2. **Update Slack Token**:
   - Get proper bot token (xoxb-)

3. **Test Full Pipeline**:
   - Run crawl-simple endpoint
   - Verify headlines in Slack
   - Approve items
   - Check Writer/Reviewer agents run
   - Mark as ReadyToPublish
   - Run publish endpoint

4. **Deploy to Netlify**:
   - Push to GitHub
   - Connect to Netlify
   - Set environment variables
   - Update Slack webhook URLs

## 📁 Important Files

### Configuration
- `.env.local` - Environment variables
- `netlify.toml` - Deployment config
- `WORKFLOW_V2.md` - New simplified workflow

### Agents
- `src/lib/agents/headline.ts` - NEW: Headline writer
- `src/lib/agents/writer.ts` - Article writer
- `src/lib/agents/reviewer.ts` - Content reviewer

### Crawlers
- `src/lib/crawlers/hackernews.ts` - HN crawler (min 100 score)
- `src/lib/crawlers/rss.ts` - RSS feeds (max 15/feed)
- `src/lib/crawlers/reddit.ts` - Reddit (min 10 upvotes)

### API Routes
- `src/app/api/cron/crawl-simple/route.ts` - NEW: Simplified pipeline
- `src/app/api/slack/interactions/route.ts` - Slack approvals

## 💡 Tips

- The simplified workflow is **much faster** - only 5-10 LLM calls instead of 50+
- Test with small samples first (3-5 items)
- Check Notion databases to see data flow
- Use test endpoints to debug each component
- Server logs are in terminal where `npm run dev` is running
