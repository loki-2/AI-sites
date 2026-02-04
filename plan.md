🎯 MVP Goal (crystal clear)

Input: Internet chaos (news, tools, Reddit, blogs)
Output:

Daily: 10–15 curated, high-signal news posts

Weekly (later): How-to blogs for vibe coders

Delivery: Slack → Approval → Website publish

For MVP: news + tools only. No feeds, no personalization yet.

You only need 5 agents to ship this.

[Source Crawler]
      ↓
[News Aggregation Agent]
      ↓
[Sorting / Filtering Agent]
      ↓
[Slack Approval Loop (Human)]
      ↓
[Article Writer Agent]
      ↓
[Reviewer Agent]
      ↓
[Publish Agent]

1️⃣ Source Crawler (Non-AI or Light AI) which runs daily twice morning 11am and 11:30pm

Purpose: Collect raw content fast.

Sources (start small, high signal)

Blogs

TechCrunch

Hacker News

Indie Hackers

OpenAI / Anthropic / Cursor blogs

Reddit

r/vibecoding

IMP: all the news/data collected should be last 24 hrs, i dont want unnecessary way long back data.
Add these to notion doc,which we integrated in the start


2️⃣ News Aggregation Agent (AI)

Role: Turn raw content → candidate news items

Responsibilities

Deduplicate

Extract why it matters

Tag content


3️⃣ Sorting & Filtering Agent (Very Important)

This is where your product wins or dies.

Goal

From 200–500 items → top 50

Ranking Criteria (hard-coded first)

Relevance to vibe coding

New tools / workflows

Actionability

Novelty (not rehashed AI news)

4️⃣ Slack Approval Loop (Human-in-the-loop MVP 🔥)
Slack bot we need to make

This is perfect. Keep it manual.

Slack Flow

Bot posts 50 headlines twice a day

Each headline = checkbox / emoji react

You approve 10–15


5️⃣ Article Writer Agent

This agent writes short, scannable articles, not essays.

Format (important)

150–250 words

Skimmable

Builder-first tone

Rules:
- Assume reader is a builder, not a journalist
- Explain what changed
- Why it matters
- When to use it
- Keep it under 250 words

6️⃣ Reviewer Agent (Quality Control)

This agent kills bad content.

Responsibilities

Improve title

Remove fluff

Ensure value density

After review, push these artciles to notion doc we have in a table may be.


7️⃣ Publish Agent (Simple Cron Job)

I human would manually review final articles on notion doc, an add a check mark in the table of each blog and a cron job pushes these articles to website and saved to db, genertaed a slug

Frontend:

I want a clean site like techcrunch, u need to ask me for screenshots while designing this UI. use shadcn UI with sharp edges of buttons

