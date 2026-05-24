const DEFAULT_SYMBOLS = {
  XCB: 'xcb_usdc',
  CTN: 'ctn_usdc',
};

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
  return `${price.symbol} $${formatUsd(price.usd)}`;
}

function formatUsd(value) {
  if (value >= 100) return trimTrailingZeros(value.toFixed(2));
  if (value >= 1) return trimTrailingZeros(value.toFixed(3));
  if (value >= 0.01) return trimTrailingZeros(value.toFixed(4));
  return trimTrailingZeros(value.toFixed(5));
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
