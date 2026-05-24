const DEFAULT_PING_TICKERS_URL = 'https://api.ping.exchange/marketdata/api/v1/tickers';

export function readConfig(env = process.env) {
  const tc001Host = normalizeHost(env.TC001_HOST);
  if (!tc001Host) {
    throw new Error('TC001_HOST is required, for example TC001_HOST=tc001.local');
  }

  const displayRotationSeconds = readPositiveNumber(env.DISPLAY_ROTATION_SECONDS, 15);
  const priceRefreshSeconds = readPositiveNumber(env.PRICE_REFRESH_SECONDS, 60);
  const requestTimeoutMs = readPositiveNumber(env.REQUEST_TIMEOUT_MS, 8000);
  const pingApiBase = stripTrailingSlash(env.PING_API_BASE || DEFAULT_PING_TICKERS_URL);

  return {
    tc001Host,
    awtrixBaseUrl: `http://${tc001Host}`,
    appName: env.AWTRIX_APP_NAME || 'xcb_ctn_prices',
    xcbUrl: env.PRICE_API_XCB || `${pingApiBase}?symbol=xcb_usdc`,
    ctnUrl: env.PRICE_API_CTN || `${pingApiBase}?symbol=ctn_usdc`,
    displayRotationMs: displayRotationSeconds * 1000,
    priceRefreshMs: priceRefreshSeconds * 1000,
    requestTimeoutMs,
    brightnessDay: readPositiveNumber(env.BRIGHTNESS_DAY, 120),
    brightnessNight: readPositiveNumber(env.BRIGHTNESS_NIGHT, 20),
    dimStartHour: readPositiveNumber(env.DIM_START_HOUR, 21),
    dimEndHour: readPositiveNumber(env.DIM_END_HOUR, 7),
    changeDisplayMs: readPositiveNumber(env.CHANGE_DISPLAY_SECONDS, 9) * 1000,
    changeScrollSpeed: readPositiveNumber(env.CHANGE_SCROLL_SPEED, 50),
  };
}

export function normalizeHost(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const url = new URL(trimmed);
    return url.host;
  }

  return trimmed.replace(/\/+$/, '');
}

function readPositiveNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive number, got: ${value}`);
  }
  return parsed;
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, '');
}
