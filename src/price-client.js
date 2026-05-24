const DEFAULT_SYMBOLS = {
  XCB: 'xcb_usdc',
  CTN: 'ctn_usdc',
};
const MAX_DISPLAY_CHARS = 8;

export function createPriceClient({ xcbUrl, ctnUrl, fetchImpl = fetch, requestTimeoutMs = 8000 }) {
  return {
    async fetchPrices() {
      const [xcb, ctn] = await Promise.all([
        fetchTicker({ url: xcbUrl, symbol: 'XCB', fetchImpl, requestTimeoutMs }),
        fetchTicker({ url: ctnUrl, symbol: 'CTN', fetchImpl, requestTimeoutMs }),
      ]);

      return {
        xcb,
        ctn,
        fetchedAt: new Date(),
      };
    },
  };
}

export async function fetchTicker({ url, symbol, fetchImpl = fetch, requestTimeoutMs = 8000 }) {
  const response = await fetchWithTimeout(fetchImpl, url, requestTimeoutMs);
  if (!response.ok) {
    throw new Error(`Price request for ${symbol} failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return parsePingTicker(data, symbol);
}

export function parsePingTicker(data, symbol) {
  const ticker = Array.isArray(data) ? data[0] : data;
  if (!ticker) {
    throw new Error(`No ticker returned for ${symbol}`);
  }

  const rawPrice = ticker.last_price ?? ticker.lastPrice;
  const usd = Number(rawPrice);
  if (!Number.isFinite(usd) || usd <= 0) {
    throw new Error(`Invalid price returned for ${symbol}: ${rawPrice}`);
  }

  return {
    symbol,
    pair: ticker.symbol || DEFAULT_SYMBOLS[symbol],
    usd,
  };
}

export function formatPriceLine(price) {
  const prefix = price.symbol;
  return `${prefix}${formatUsd(price.usd, MAX_DISPLAY_CHARS - prefix.length)}`;
}

function formatUsd(value, maxChars) {
  const maxDecimals = value >= 1 ? 4 : 6;
  for (let decimals = maxDecimals; decimals >= 0; decimals -= 1) {
    const formatted = trimLeadingZero(trimTrailingZeros(value.toFixed(decimals)));
    if (formatted.length <= maxChars) {
      return formatted;
    }
  }

  return trimLeadingZero(value.toPrecision(2)).slice(0, maxChars);
}

function trimLeadingZero(value) {
  if (value.startsWith('0.')) return value.slice(1);
  if (value.startsWith('-0.')) return `-${value.slice(2)}`;
  return value;
}

function trimTrailingZeros(value) {
  return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

async function fetchWithTimeout(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Price request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
