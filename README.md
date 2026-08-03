# FastPromo — Web (Next.js) + Discord bot

## Deploy web on Vercel

The Next.js shop lives at the **repo root**. The Discord bot in `/bot` is deployed separately on Railway.

### Option A — Dashboard (recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** the repo.
3. Framework: **Next.js** (auto-detected). Root Directory: `.` (leave default).
4. Add Environment Variables (Production + Preview):

| Variable | Notes |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` or test |
| `STRIPE_WEBHOOK_SECRET` | from Stripe webhook endpoint |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` (update after first deploy) |
| `MOOGOLD_PARTNER_ID` | partner id |
| `MOOGOLD_SECRET_KEY` | API secret |
| `MOOGOLD_CATEGORY_ID` | usually `50` |
| `MOOGOLD_SKU_MLBB_*` | product SKUs |
| `DISCORD_WEBHOOK_URL` | optional logs webhook |
| `DISCORD_ADMIN_ROLE_ID` / `DISCORD_ADMIN_USER_ID` | optional |
| `BOT_WEBHOOK_URL` | Railway bot URL, e.g. `https://xxx.up.railway.app` |
| `INTERNAL_WEBHOOK_SECRET` | same secret as Railway bot |

5. Deploy.
6. Set `NEXT_PUBLIC_SITE_URL` to the real Vercel URL and redeploy.
7. In Stripe → Webhooks → endpoint:
   `https://your-app.vercel.app/api/webhook`
   Event: `checkout.session.completed`

### Option B — CLI

```bash
npx vercel login
npx vercel        # preview
npx vercel --prod # production
```

### Region

`vercel.json` targets **fra1** (Frankfurt) for the EU market.

## Discord bot

See [`bot/README.md`](bot/README.md) for Railway.
