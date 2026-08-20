// AFTER: one vendor, one key, one bill — errors + flags unified behind Infrai.
// Same handler as src/before.ts, minus the second SDK, second key, second dashboard.
import { infrai } from "./infrai.ts";

/** Seed the flag once (was a LaunchDarkly flag): create it, default off. */
export async function seed(): Promise<void> {
  await infrai.flags.set({
    key: "new_flow",
    description: "Enable the new checkout flow",
    type: "bool",
    default_value: false,
    enabled: true,
  });
}

export async function handle(userId: string): Promise<void> {
  // Feature flag (was LaunchDarkly) — evaluated server-side, same key as errors.
  const { enabled: useNew } = await infrai.flags.is_enabled("new_flow", userId);
  try {
    if (!useNew) throw new Error("legacy flow disabled");
  } catch (err) {
    // Error capture (was Sentry) — one key covers both signals.
    await infrai.errors.capture({
      message: (err as Error).message,
      level: "error",
      context: { userId, flow: "checkout" },
    });
    throw err;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => handle("u_7"))
    .catch((e) => console.error("captured:", e.message));
}
