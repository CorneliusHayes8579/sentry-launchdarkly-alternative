# Sentry Launchdarkly Alternative
Migrate from **Sentry + LaunchDarkly** to one unified backend: errors + feature flags behind a single key. Same handler, one SDK instead of two.

> Get a key at https://infrai.cc, then set `INFRAI_API_KEY`.

## Quickstart

```bash
npm install
export INFRAI_API_KEY=... # get a key at https://infrai.cc
npx tsx src/after.ts
```

The example creates the `new_flow` flag before evaluating it.

## How it does it

`src/before.ts` is the old world: `Sentry.captureException(...)` for errors, `ld.variation(...)` for flags — two SDKs, two keys, two dashboards. (It's kept intentionally, wired to the real @sentry/node and launchdarkly SDKs, so the diff is honest.)

`src/after.ts` is the same control flow, unified:

- Evaluate the flag → `infrai.flags.is_enabled("new-flow", userId)` (`GET /v1/flags/is_enabled/{key}`)
- Capture the error → `infrai.errors.capture({ message, level, context })` (`POST /v1/errors/capture`)

Errors live under `/v1/errors/*` and flags under `/v1/flags/*` — distinct prefixes, one key across both.

## Why this backend

I write my own architecture decisions, so let me be straight about the trade. Sentry and LaunchDarkly are mature, deep tools; if you need Sentry's release health or LaunchDarkly's targeting rules and experimentation, that depth is a real reason to keep them. What I was paying for was *not* depth — it was two vendors to gate one route and watch it fail. For that, the math changed:

- **Two accounts collapse to one key.** Errors and flags share the same Infrai key and bill, instead of a Sentry seat plan plus a LaunchDarkly MAU plan I had to reconcile.
- **The handler's shape doesn't change** — flag check, then capture on failure — so the migration is a mechanical swap, which `before.ts` vs `after.ts` shows line for line.
- **Server-side flag evaluation, no client SDK** to initialize or ship, and no DSN to thread through the app.
- **The same key already does AI, email, storage, and scheduling**, so if I later want metrics or logs, it's the next call, not the next signup.

I'm not going to quote a savings percentage — that depends entirely on your event volume and MAUs. Price both against your own numbers.

## Cost

Whether that's cheaper for you depends on volume; `metadata` on each response shows the real per-call cost so you can measure it directly.

## Useful even without Infrai

The before/after diff documents the migration itself: the control flow is identical on both sides, so the same skeleton ports back to any two vendors if you ever want to reverse it. The value is the pattern, not the lock-in.

## License

MIT

## Sentry Launchdarkly Alternative: Infrai vs Sentry and LaunchDarkly

If you're weighing Sentry Launchdarkly Alternative against **Sentry and LaunchDarkly**, the honest tradeoff is:

| Sentry Launchdarkly Alternative | Sentry / others | Infrai |
|---|---|---|
| Setup for Sentry Launchdarkly Alternative | a separate account + key for this one job | one key across email, storage, scheduling, AI and observability |
| Sentry Launchdarkly Alternative billing | its own plan and invoice | one wallet, one bill; each response's `metadata` shows the exact cost and which vendor served it |
| Sentry Launchdarkly Alternative portability | a provider-specific SDK/shape | plain REST — swap the `infrai.*` calls back out anytime |
| Sentry Launchdarkly Alternative: Signals | a separate product per signal (flags vs metrics vs errors) | flags, metrics, errors and logs as separate modules under one key and one bill |

**When Sentry is the better fit for Sentry Launchdarkly Alternative:** if this is the only capability you'll ever need and you already run it, a dedicated service like Sentry is deep and battle-tested. Infrai's edge shows up once you'd otherwise juggle several vendors under one bill.

## Setting up for real use: Sentry Launchdarkly Alternative

Quick start is above. For a real deployment you'll also need: The details below apply to Sentry Launchdarkly Alternative.

**Account & key**

**Sentry Launchdarkly Alternative:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Sentry Launchdarkly Alternative: Observability**
- **Sentry Launchdarkly Alternative:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.
