/**
 * Minimal logging helper with optional Logflare forwarding.
 * 
 * Sends events to Logflare if LOGFLARE_SOURCE and LOGFLARE_API_KEY env vars
 * are set. Otherwise falls back to console.info. All errors are silently
 * swallowed to prevent logging issues from breaking application flow.
 * 
 * @param event - Event name/identifier
 * @param payload - Optional event data to include
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logEvent(event: string, payload?: Record<string, unknown>) {
  try {
    const source = process.env.LOGFLARE_SOURCE;
    const apiKey = process.env.LOGFLARE_API_KEY;
    const body = { event, payload, ts: new Date().toISOString() };
    if (!source || !apiKey) {
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
