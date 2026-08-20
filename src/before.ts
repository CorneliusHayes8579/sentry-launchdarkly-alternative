// BEFORE: two vendors, two SDKs, two keys, two dashboards.
// Error tracking from Sentry; feature flags from LaunchDarkly. Kept here for
// reference — this is what src/after.ts replaces with a single key.
import * as Sentry from "@sentry/node";
import { init as ldInit } from "launchdarkly-node-server-sdk";

Sentry.init({ dsn: process.env.SENTRY_DSN! });
const ld = ldInit(process.env.LAUNCHDARKLY_SDK_KEY!);

export async function handle(userId: string): Promise<void> {
  await ld.waitForInitialization();
  const useNewFlow = await ld.variation("new-flow", { key: userId }, false);
  try {
    if (!useNewFlow) throw new Error("legacy flow disabled");
  } catch (err) {
    Sentry.captureException(err);   // → the Sentry dashboard, a separate bill
    throw err;
  }
}
