/**
 * Minimal logging helper with optional Logflare forwarding.
 * If LOGFLARE_SOURCE and LOGFLARE_API_KEY are not set, falls back to console.
 */
export async function logEvent(event: string, payload?: Record<string, unknown>) {
  try {
    const source = process.env.LOGFLARE_SOURCE;
    const apiKey = process.env.LOGFLARE_API_KEY;
    const body = { event, payload, ts: new Date().toISOString() };
    if (!source || !apiKey) {
      // eslint-disable-next-line no-console
      console.info("logEvent", body);
      return;
    }
    await fetch("https://api.logflare.app/logs?source=" + encodeURIComponent(source), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // swallow
  }
}

