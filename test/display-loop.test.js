import assert from 'node:assert/strict';
import test from 'node:test';

import { createDisplayLoop, pickDisplayFrame } from '../src/display-loop.js';

test('pickDisplayFrame alternates XCB and CTN frames', () => {
  const prices = {
    xcb: { symbol: 'XCB', usd: 0.0499 },
    ctn: { symbol: 'CTN', usd: 0.0068 },
  };

  assert.deepEqual(pickDisplayFrame(prices, 0, { xcb: 'xcb-icon', ctn: 'ctn-icon' }), {
    text: 'XCB $0.0499',
    color: '#00E676',
    icon: 'xcb-icon',
  });
  assert.deepEqual(pickDisplayFrame(prices, 1, { xcb: 'xcb-icon', ctn: 'ctn-icon' }), {
    text: 'CTN $0.0068',
    color: '#FF9800',
    icon: 'ctn-icon',
  });
});

test('createDisplayLoop refreshes prices once and displays the first frame in once mode', async () => {
  const shown = [];
  const loop = createDisplayLoop({
    priceClient: {
      fetchPrices: async () => ({
        xcb: { symbol: 'XCB', usd: 0.0499 },
        ctn: { symbol: 'CTN', usd: 0.0068 },
      }),
    },
    awtrixClient: {
      showText: async (text, options) => shown.push({ text, options }),
    },
    logger: { info() {}, warn() {}, error() {} },
    icons: { xcb: 'xcb-icon', ctn: 'ctn-icon' },
  });

  await loop.runOnce();

  assert.deepEqual(shown, [{ text: 'XCB $0.0499', options: { color: '#00E676', icon: 'xcb-icon' } }]);
});
