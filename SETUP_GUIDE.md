# VibeCoders News - Setup Guide

This guide walks you through setting up all the services and deploying the application.

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings > API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (not anon key!) → `SUPABASE_SERVICE_ROLE_KEY`

4. Go to **SQL Editor** and run this query:

```sql
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,
  summary text,
  original_url text,
  source text,
  tags text[],
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_articles_slug on articles(slug);
create index idx_articles_published_at on articles(published_at desc);
```

## 2. Notion Setup

### Create Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Name it "VibeCoders News"
4. Select capabilities: Read, Update, Insert content
5. Copy the **Internal Integration Token** → `NOTION_API_KEY`

### Create Databases

Create 3 databases in Notion. For each database, share it with your integration (click Share > Invite > select your integration).

**Database 1: Raw Items**

| Property | Type |
|----------|------|
| Title | Title |
| URL | URL |
| Source | Select |
| Content | Text |
| CrawledAt | Date |
| Score | Number |

Copy the database ID from the URL → `NOTION_RAW_DB_ID`

**Database 2: Processed Items**

| Property | Type |
|----------|------|
| Title | Title |
| OriginalURL | URL |
| Summary | Text |
| Tags | Multi-select |
| RelevanceScore | Number |
| SlackApproved | Checkbox |
| ArticleContent | Text |
| ReviewedContent | Text |
| ReadyToPublish | Checkbox |

Copy the database ID → `NOTION_PROCESSED_DB_ID`

**Database 3: Published Items**

| Property | Type |
|----------|------|
| Title | Title |
| Slug | Text |
| Content | Text |
| PublishedAt | Date |
| SupabaseID | Text |

Copy the database ID → `NOTION_PUBLISHED_DB_ID`

**How to get Database ID:**
Open the database in Notion, look at the URL:
```
https://notion.so/yourworkspace/DATABASE_ID_HERE?v=...
```

## 3. Google AI (Gemini) Setup

1. Go to [makersuite.google.com](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it → `GOOGLE_API_KEY`

## 4. Slack App Setup

### Create the App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** > **From scratch**
3. Name: "VibeCoders News Bot"
4. Select your workspace

### Configure OAuth & Permissions

1. Go to **OAuth & Permissions**
2. Add these **Bot Token Scopes**:
   - `chat:write`
   - `channels:read`
   - `reactions:read`
3. Click **Install to Workspace**
4. Copy **Bot User OAuth Token** → `SLACK_BOT_TOKEN`

### Configure Signing Secret

1. Go to **Basic Information**
2. Copy **Signing Secret** → `SLACK_SIGNING_SECRET`

### Configure Event Subscriptions (After Deployment)

1. Go to **Event Subscriptions**
2. Enable Events
3. Set Request URL: `https://your-site.netlify.app/api/slack/events`
4. Subscribe to bot events:
   - `app_mention`
   - `reaction_added`

### Configure Interactivity (After Deployment)

1. Go to **Interactivity & Shortcuts**
2. Enable Interactivity
3. Set Request URL: `https://your-site.netlify.app/api/slack/interactions`

### Get Channel ID

1. In Slack, right-click on the channel where you want the bot to post
2. Click **View channel details**
3. Copy the Channel ID (at the bottom) → `SLACK_CHANNEL_ID`

### Invite Bot to Channel

Type `/invite @VibeCoders News Bot` in your channel

## 5. Deploy to Netlify

### Option A: Via GitHub

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign up/login
3. Click **Add new site** > **Import an existing project**
4. Connect to GitHub and select your repo
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click **Deploy site**

### Option B: Via CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Add Environment Variables

1. Go to **Site settings** > **Environment variables**
2. Add all the variables from `.env.example`:

```
GOOGLE_API_KEY=your_key
LLM_PROVIDER=gemini
NOTION_API_KEY=your_key
NOTION_RAW_DB_ID=your_id
NOTION_PROCESSED_DB_ID=your_id
NOTION_PUBLISHED_DB_ID=your_id
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
SLACK_BOT_TOKEN=your_token
SLACK_SIGNING_SECRET=your_secret
SLACK_CHANNEL_ID=your_channel
CRON_SECRET=generate_a_random_string
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

3. Trigger a new deploy for the variables to take effect

## 6. Update Slack URLs

After deploying, update your Slack app:

1. **Event Subscriptions URL**: `https://your-site.netlify.app/api/slack/events`
2. **Interactivity URL**: `https://your-site.netlify.app/api/slack/interactions`

## 7. Test the System

### Test Crawl Pipeline

```bash
curl -X POST https://your-site.netlify.app/api/cron/crawl \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Publish Pipeline

```bash
curl -X POST https://your-site.netlify.app/api/cron/publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Scheduled Functions

The app has two scheduled functions that run automatically:

- **scheduled-crawl**: Runs at 11am and 11pm UTC daily
- **scheduled-publish**: Runs at 12pm UTC daily

You can adjust the schedule in `netlify.toml` or in the function files under `netlify/functions/`.

## Troubleshooting

### Slack not receiving messages

- Verify bot is invited to the channel
- Check the Slack signing secret is correct
- Look at Netlify function logs

### Notion errors

- Make sure databases are shared with your integration
- Verify database IDs are correct
- Check property names match exactly (case-sensitive)

### Build failures

- Ensure all environment variables are set in Netlify
- Check the Netlify deploy logs for specific errors

### Crawl not finding items

- Check that source RSS feeds are accessible
- Reddit's JSON endpoint may have rate limits
- HackerNews filter might be too strict
