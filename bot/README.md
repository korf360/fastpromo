# FastPromo Discord Bot

Core logic: tickets, rank roles, slash commands, MooGold health monitor, Express webhook logger.

## Quick start

1. Fill root `.env` / `.env.local` (see `.env.example`).
2. Enable **Server Members Intent** for the bot in the Discord Developer Portal.
3. Invite with Manage Channels, Manage Roles, Send Messages, Embed Links (Administrator recommended for setup).

```bash
cd bot
npm install
npm run setup    # channels + ticket/rank/status/broadcast panels
npm start        # Discord client + Express webhook server
```

## Slash commands

| Command | Who | Action |
|---|---|---|
| `/prices` | Everyone | Catalog embed + shop link |
| `/order [transaction_id]` | Everyone | Lookup by support ID `FP-…` (account page) or Stripe `cs_…` |
| `/topup` | Everyone | Modal → package select → Stripe checkout link |
| `/status` | Admin | Update `✦｜sᴇʀᴠᴇʀ-sᴛᴀᴛᴜs` |
| `/giveaway` | Admin | Timed giveaway in events channel |

## Express (bot)

- Local: `PORT` or `BOT_PORT` (default **3001**)
- Railway: uses injected `PORT` automatically; listens on `0.0.0.0`

- `GET /health`
- `POST /api/webhooks/stripe-moogold`  
  Events: `payment.initiated` | `payment.success` | `payment.failed`  
  Header (optional): `X-FastPromo-Secret: $INTERNAL_WEBHOOK_SECRET`

## Deploy on Railway

This monorepo also has a root `railway.toml` that **forces the Discord bot**
(not the Next.js shop). The shop stays on Vercel.

1. Railway project → service connected to this GitHub repo.
2. Prefer **Root Directory** = `bot` (uses `bot/railway.toml`), **or** leave
   root empty and rely on the root `railway.toml` start command.
3. Add variables (Variables tab):

| Variable | Required |
|---|---|
| `DISCORD_TOKEN` | yes |
| `GUILD_ID` | yes |
| `CLIENT_ID` | yes |
| `DISCORD_ADMIN_ROLE_ID` | recommended |
| `NEXT_PUBLIC_SITE_URL` | yes (`https://fastpromo-eta.vercel.app`) |
| `MOOGOLD_PARTNER_ID` / `MOOGOLD_SECRET_KEY` | yes (health monitor) |
| `INTERNAL_WEBHOOK_SECRET` | recommended |
| `DISCORD_AUTO_SETUP` | `false` after first setup |

4. Generate a public domain for the service (Settings → Networking).
5. On the **Next.js / Vercel** app, set:
   - `BOT_WEBHOOK_URL=https://your-bot.up.railway.app`
   - same `INTERNAL_WEBHOOK_SECRET`

6. After first deploy, run guild setup once (local or one-off):
   ```bash
   cd bot && npm run setup
   ```
   Or temporarily set `DISCORD_AUTO_SETUP=true`, redeploy, then set it back to `false`.

Health check path: `/health` (must return JSON from the **bot**, not Next.js).

If `/prices` says “application did not respond”, Railway was probably running
Next.js instead of the bot — confirm `/health` returns
`{"ok":true,"service":"fastpromo-discord-bot"}`.

## Notes

- Discord modals cannot contain select menus — `/topup` uses modal (IDs) then an ephemeral package dropdown.
- Set `DISCORD_ADMIN_ROLE_ID` for ticket access + urgent pings.
- Enable **Server Members Intent** in the Discord Developer Portal.
- Set `DISCORD_AUTO_SETUP=true` only for the first bootstrap on Railway if you prefer.
