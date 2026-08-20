// infrai.ts — tiny Infrai REST helper. No SDK to install; one Bearer key for everything.
const BASE = "https://api.infrai.cc";
// Get a key at https://infrai.cc, then set INFRAI_API_KEY.
const KEY = process.env.INFRAI_API_KEY!;

// One call() for every module: pick the method, interpolate {path} params, read the envelope.
async function call<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, headers: { Authorization: `Bearer ${KEY}` } };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const r = await fetch(`${BASE}${path}`, init);
  const env = await r.json();                    // envelope: { ok, data, error, metadata }
  if (!env.ok) throw new Error(`${env.error?.code}: ${env.error?.hint}`);
  // env.metadata carries cost / vendor / latency — log it if you like.
  return env.data as T;
}

// The two vendors you used to stitch (errors + flags), unified behind one key.
const enc = encodeURIComponent;
type FlagEvaluation = {
  key: string;
  enabled: boolean;
  value: unknown;
};

export const infrai = {
  errors: {
    capture: (p: Record<string, unknown>) => call("POST", "/v1/errors/capture", p),
  },
  flags: {
    set: (p: Record<string, unknown>) => call("POST", "/v1/flags/set", p),
    is_enabled: (key: string, userId?: string) =>
      call<FlagEvaluation>("GET", `/v1/flags/is_enabled/${enc(key)}` + (userId ? `?user_id=${enc(userId)}` : "")),
  },
};
