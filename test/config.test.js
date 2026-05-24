import assert from 'node:assert/strict';
import test from 'node:test';

import { readConfig } from '../src/config.js';

test('readConfig applies safe defaults and normalizes the TC001 host', () => {
  const config = readConfig({
    TC001_HOST: 'http://192.168.1.50/',
  });

  assert.equal(config.tc001Host, '192.168.1.50');
  assert.equal(config.awtrixBaseUrl, 'http://192.168.1.50');
  assert.equal(config.displayRotationMs, 15_000);
  assert.equal(config.priceRefreshMs, 60_000);
  assert.equal(config.appName, 'xcb_ctn_prices');
});

test('readConfig rejects missing TC001_HOST', () => {
  assert.throws(() => readConfig({}), /TC001_HOST/);
});
