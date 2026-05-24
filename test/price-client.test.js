import assert from 'node:assert/strict';
import test from 'node:test';

import { createPriceClient, formatPriceLine, parsePingTicker } from '../src/price-client.js';

test('parsePingTicker accepts Ping Exchange ticker arrays and lastPrice', () => {
  const price = parsePingTicker([{ symbol: 'xcb_usdc', lastPrice: 0.0499 }], 'XCB');

  assert.deepEqual(price, {
    symbol: 'XCB',
    pair: 'xcb_usdc',
    usd: 0.0499,
  });
});

test('parsePingTicker rejects empty or zero prices', () => {
  assert.throws(() => parsePingTicker([], 'XCB'), /No ticker/);
  assert.throws(() => parsePingTicker([{ lastPrice: 0 }], 'XCB'), /Invalid price/);
});

test('formatPriceLine keeps small token prices readable on a 32x8 display', () => {
  assert.equal(formatPriceLine({ symbol: 'XCB', usd: 0.0499 }), 'XCB .0499');
  assert.equal(formatPriceLine({ symbol: 'CTN', usd: 0.0068 }), 'CTN .0068');
});

test('formatPriceLine shortens decimals to fit one display page', () => {
  assert.equal(formatPriceLine({ symbol: 'XCB', usd: 0.123456 }), 'XCB .1235');
  assert.equal(formatPriceLine({ symbol: 'CTN', usd: 1.23456 }), 'CTN 1.235');
});

test('createPriceClient fetches XCB and CTN prices from configured endpoints', async () => {
  const requestedUrls = [];
  const fetchImpl = async (url) => {
    requestedUrls.push(String(url));
    if (String(url).includes('xcb_usdc')) {
      return Response.json([{ symbol: 'xcb_usdc', lastPrice: 0.0499 }]);
    }
    return Response.json([{ symbol: 'ctn_usdc', lastPrice: 0.0068 }]);
  };

  const client = createPriceClient({
    xcbUrl: 'https://example.test/tickers?symbol=xcb_usdc',
    ctnUrl: 'https://example.test/tickers?symbol=ctn_usdc',
    fetchImpl,
  });

  const prices = await client.fetchPrices();

  assert.equal(requestedUrls.length, 2);
  assert.equal(prices.xcb.usd, 0.0499);
  assert.equal(prices.ctn.usd, 0.0068);
  assert.ok(prices.fetchedAt instanceof Date);
});
