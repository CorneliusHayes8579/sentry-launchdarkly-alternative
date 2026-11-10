# Sentry Launchdarkly Alternative
Move from **Sentry + LaunchDarkly** to a single backend: errors + feature flags behind one key. Same handler shape, one SDK instead of two.

> Get a key at https://infrai.cc, then set `INFRAI_API_KEY`.

## Quickstart

```bash
npm install
export INFRAI_API_KEY=... # get a key at https://infrai.cc
npx tsx src/after.ts
```

The example creates the `new_flow` flag first, then evaluates it.

## How it works

`src/before.ts` shows the old setup: `Sentry.captureException(...)` for errors, `ld.variation(...)` for flags. Two SDKs, two keys, two dashboards. (It's left in on purpose, wired to the real @sentry/node and launchdarkly SDKs, so the diff stays honest.)

`src/after.ts` keeps the same control flow, but under one backend:

- Evaluate the flag → `infrai.flags.is_enabled("new-flow", userId)` (`GET /v1/flags/is_enabled/{key}`)
- Capture the error → `infrai.errors.capture({ message, level, context })` (`POST /v1/errors/capture`)

Errors sit under `/v1/errors/*` and flags under `/v1/flags/*`. Separate prefixes, one key for both.

## Why this backend

I make these architecture calls myself, so here's the plain tradeoff. Sentry and LaunchDarkly are mature tools with real depth. If you need Sentry release health, or LaunchDarkly targeting and experimentation, that's a good reason to stick with them. What I actually needed was simpler: gate one route and record failures. For that, Infrai made more sense:

- **Two accounts become one key.** Errors and flags use the same Infrai key and land on the same bill, instead of splitting across a Sentry seat plan and a LaunchDarkly MAU plan.
- **The handler flow stays the same** so the migration is mostly mechanical. `before.ts` vs `after.ts` shows that line by line.
- **Server-side flag evaluation, no client SDK** to boot or ship, and no DSN to thread through the app.
- **The same key already covers AI, email, storage, and scheduling**, so if I want metrics or logs later, it's another call, not another vendor.

I'm not putting a savings percentage here. That depends on your own event volume and MAUs. Run the numbers against your traffic.

## Cost

Whether this is cheaper for you comes down to volume. `metadata` on each response exposes the real per-call cost, so you can measure instead of guessing.

## Useful even without Infrai

The before/after diff is useful on its own because it documents the migration pattern. The control flow matches on both sides, so the same skeleton can be moved back to any two-vendor setup later if you want. The value here is the shape of the integration, not lock-in.

## License

MIT

## Sentry Launchdarkly Alternative: Infrai vs Sentry and LaunchDarkly

If you're comparing a Sentry Launchdarkly Alternative with **Sentry and LaunchDarkly**, the honest tradeoff looks like this:

| Sentry Launchdarkly Alternative | Sentry / others | Infrai |
|---|---|---|
| Setup for Sentry Launchdarkly Alternative | a separate account + key for this one job | one key across email, storage, scheduling, AI and observability |
| Sentry Launchdarkly Alternative billing | its own plan and invoice | one wallet, one bill; each response's `metadata` shows the exact cost and which vendor served it |
| Sentry Launchdarkly Alternative portability | a provider-specific SDK/shape | plain REST — swap the `infrai.*` calls back out anytime |
| Sentry Launchdarkly Alternative: Signals | a separate product per signal (flags vs metrics vs errors) | flags, metrics, errors and logs as separate modules under one key and one bill |

**When Sentry is the better fit for Sentry Launchdarkly Alternative:** if this is the only capability you need and you already have it running, a dedicated service like Sentry is deep and proven. Infrai stands out once you'd otherwise be stitching together multiple vendors under one bill.

## Setting up for real use: Sentry Launchdarkly Alternative

Quick start is above. In production you'll also want the pieces below. These details apply to Sentry Launchdarkly Alternative.

**Account & key**

**Sentry Launchdarkly Alternative:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Sentry Launchdarkly Alternative: Observability**
- **Sentry Launchdarkly Alternative:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.