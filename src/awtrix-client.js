export function createAwtrixClient({ baseUrl, appName, fetchImpl = fetch, requestTimeoutMs = 8000 }) {
  const endpoint = `${baseUrl}/api/custom?name=${encodeURIComponent(appName)}`;
  const settingsEndpoint = `${baseUrl}/api/settings`;

  return {
    async setBrightness(value) {
      const response = await fetchWithTimeout(fetchImpl, settingsEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ BRI: value }),
      }, requestTimeoutMs);
      if (!response.ok) {
        throw new Error(`AWTRIX settings failed with HTTP ${response.status}`);
      }
    },

    async showText(text, options = {}) {
      const payload = buildCustomAppPayload(text, options);
      const response = await fetchWithTimeout(fetchImpl, endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }, requestTimeoutMs);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`AWTRIX request failed with HTTP ${response.status}${body ? `: ${body}` : ''}`);
      }
    },
  };
}

export function buildCustomAppPayload(text, options = {}) {
  const payload = {
    text,
    color: options.color || '#FFFFFF',
    center: true,
    textCase: 2,
    noScroll: options.noScroll !== false,
    lifetime: options.lifetime ?? 120,
    lifetimeMode: options.lifetimeMode ?? 1,
  };

  if (options.icon) {
    payload.icon = options.icon;
  }

  return payload;
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`AWTRIX request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
