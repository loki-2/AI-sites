# Slack Interactive Buttons Setup

## The Issue

When you click Approve/Reject buttons in Slack, you get:
> "This app is not configured to handle interactive responses. Please configure interactivity URL..."

## Solution

### Option 1: Deploy to Netlify First (Recommended)

1. **Deploy your app to Netlify** (see DEPLOYMENT.md)
2. **Get your deployment URL**: `https://your-app.netlify.app`
3. **Configure Slack Interactivity**:
   - Go to https://api.slack.com/apps
   - Select your app
   - Click **Interactivity & Shortcuts** in the sidebar
   - Toggle **Interactivity** to **On**
   - Set **Request URL** to: `https://your-app.netlify.app/api/slack/interactions`
   - Click **Save Changes**

### Option 2: Test Locally with ngrok

For local testing without deploying:

1. **Install ngrok**:
   ```bash
   brew install ngrok
   # OR download from: https://ngrok.com/download
   ```

2. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

3. **In a new terminal, run ngrok**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok output:
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Configure Slack with ngrok URL**:
   - Go to https://api.slack.com/apps
   - Select your app
   - Click **Interactivity & Shortcuts**
   - Toggle **Interactivity** to **On**
   - Set **Request URL** to: `https://abc123.ngrok.io/api/slack/interactions`
   - Click **Save Changes**

   **Also update Event Subscriptions**:
   - Click **Event Subscriptions**
   - Update **Request URL** to: `https://abc123.ngrok.io/api/slack/events`
   - Click **Save Changes**

6. **Test the buttons** - they should work now!

**Note**: ngrok URLs change every time you restart it (unless you have a paid plan). You'll need to update Slack URLs each time.

## Verify the Endpoint is Working

Test your interactions endpoint:

```bash
# Should return 200 OK (even though it says "Missing signature")
curl -X POST http://localhost:3000/api/slack/interactions \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

## What Happens When You Click Approve?

1. Slack sends a POST request to `/api/slack/interactions`
2. Our API verifies the request signature
3. Finds the item in Notion (using the `notionPageId`)
4. Updates `SlackApproved = true` in Notion
5. Triggers the **Writer Agent** to create a 150-250 word article
6. Triggers the **Reviewer Agent** to polish it
7. Saves the result to Notion `Article Content` property
8. Posts a reply in Slack: "✅ Item approved - Article will be generated"

## Troubleshooting

### "URL verification failed"
- Make sure your server is running
- Check the URL is correct (no typos)
- If using ngrok, make sure it's still running

### "Invalid signature"
- Check your `SLACK_SIGNING_SECRET` is correct in `.env.local`
- Make sure it matches the one in your Slack app settings

### Buttons still don't work
- Check server logs for errors
- Test the endpoint manually (see above)
- Make sure bot is in the channel

## My Recommendation

**Deploy to Netlify first**, then configure the production URL. It's simpler and more reliable than ngrok for ongoing use.

Would you like me to help you deploy to Netlify now?
