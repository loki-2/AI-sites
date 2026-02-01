# Deployment Guide - VibeCoders News

## Quick Deploy to Netlify

### 1. Push to GitHub

```bash
# Already done if you're reading this!
git remote add origin https://github.com/YOUR_USERNAME/vibecoders-news.git
git push -u origin main
```

### 2. Deploy to Netlify

1. **Go to Netlify**: https://app.netlify.com/
2. **Click**: "Add new site" → "Import an existing project"
3. **Connect to GitHub**: Authorize Netlify
4. **Select your repo**: `vibecoders-news`
5. **Build settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Framework: Next.js

6. **Click**: "Deploy site"

### 3. Configure Environment Variables

Once deployed, go to: **Site settings** → **Environment variables**

Add all these (copy from your `.env.local`):

```
# LLM
GOOGLE_API_KEY=AIzaSy...
OPENAI_API_KEY=(optional)
LLM_PROVIDER=gemini

# Notion
NOTION_API_KEY=ntn_173...
NOTION_RAW_DB_ID=2f94078ba290801a8deae7a20b9d78ee
NOTION_PROCESSED_DB_ID=2f94078ba29080c381ebe06130672e6a
NOTION_PUBLISHED_DB_ID=2f94078ba290807bb19bd95b2ed1aa0e

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ayhpvcafgicrhtanduxd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Slack
SLACK_BOT_TOKEN=xoxb-... (IMPORTANT: Must be Bot User OAuth Token)
SLACK_SIGNING_SECRET=681aef82da5864995bdfb1e21ca7078c
SLACK_CHANNEL_ID=C06JC2NHXB5

# Security
CRON_SECRET=vibecoders-cron-secret-2024
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

**Important**: Update `NEXT_PUBLIC_APP_URL` with your actual Netlify URL!

### 4. Update Slack URLs

After deployment, update your Slack app with production URLs:

1. **Go to**: https://api.slack.com/apps → Your App
2. **Interactivity & Shortcuts**:
   - Request URL: `https://your-site.netlify.app/api/slack/interactions`
3. **Event Subscriptions**:
   - Request URL: `https://your-site.netlify.app/api/slack/events`
4. **Click** "Save Changes"

### 5. Test the Deployment

```bash
# Test homepage
curl https://your-site.netlify.app

# Test crawl endpoint (should require auth)
curl -X POST https://your-site.netlify.app/api/cron/crawl-simple \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"
```

## Scheduled Functions

Netlify will automatically run these on schedule:

- **11:00 AM UTC**: Morning crawl (`/api/cron/crawl-simple`)
- **11:30 PM UTC**: Evening crawl (`/api/cron/crawl-simple`)
- **12:00 PM UTC**: Auto-publish (`/api/cron/publish`)

You can also trigger them manually from Netlify dashboard:
**Functions** → Select function → **Invoke**

## Workflow After Deployment

### Daily Flow:

1. **11 AM & 11:30 PM**: Scheduled crawl runs automatically
2. **Check Slack**: Review headlines, click Approve on 5-10 items
3. **Check Notion**: Review generated articles in Processed DB
4. **Mark Ready**: Set `ReadyToPublish = true` for approved articles
5. **12 PM**: Auto-publish runs (or trigger manually)
6. **Live**: Articles appear on your website!

### Manual Triggers:

```bash
# Manual crawl
curl -X POST https://your-site.netlify.app/api/cron/crawl-simple \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"

# Manual publish
curl -X POST https://your-site.netlify.app/api/cron/publish \
  -H "Authorization: Bearer vibecoders-cron-secret-2024"
```

## Troubleshooting

### Deployment fails?
- Check build logs in Netlify
- Make sure all dependencies are in `package.json`
- Verify Node.js version (should be 18+)

### Slack buttons not working?
- Verify Interactivity URL is correct
- Check you're using Bot User OAuth Token (xoxb-), not App-level token
- Make sure bot is in the channel

### Scheduled functions not running?
- Check function logs in Netlify
- Verify `CRON_SECRET` is set
- Check function status in Netlify dashboard

### Articles not appearing?
- Check Supabase has the `articles` table
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check homepage is fetching from Supabase

## Custom Domain (Optional)

1. **Netlify Dashboard** → **Domain settings**
2. **Add custom domain**: `vibecoders.news` (or your domain)
3. **Update DNS**: Follow Netlify's instructions
4. **Update** `NEXT_PUBLIC_APP_URL` environment variable
5. **Update** Slack URLs with new domain

## Monitoring

- **Netlify Analytics**: Built-in traffic stats
- **Function Logs**: Check for errors
- **Supabase Dashboard**: Monitor database usage
- **Notion**: Track content pipeline
- **Slack**: Get notifications for each step

## Need Help?

- Netlify Docs: https://docs.netlify.com/
- Next.js Deployment: https://nextjs.org/docs/deployment
- Check `TESTING.md` for manual testing
- Check `SLACK_SETUP.md` for Slack configuration

---

🚀 Once deployed, your site will be live at: `https://your-site-name.netlify.app`
