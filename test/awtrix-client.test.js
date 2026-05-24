import assert from 'node:assert/strict';
import test from 'node:test';

import { createAwtrixClient } from '../src/awtrix-client.js';

test('createAwtrixClient posts a custom app payload to AWTRIX HTTP API', async () => {
  const calls = [];
  const client = createAwtrixClient({
    baseUrl: 'http://tc001.local',
    appName: 'xcb_ctn_prices',
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return Response.json({ ok: true });
    },
  });

  await client.showText('XCB.0499', { color: '#00E676' });

  assert.equal(calls[0].url, 'http://tc001.local/api/custom?name=xcb_ctn_prices');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    text: 'XCB.0499',
    color: '#00E676',
    center: true,
    textCase: 2,
    noScroll: true,
    lifetime: 120,
    lifetimeMode: 1,
  });
});

test('createAwtrixClient includes an icon when provided', async () => {
  const calls = [];
  const client = createAwtrixClient({
    baseUrl: 'http://tc001.local',
    appName: 'xcb_ctn_prices',
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return Response.json({ ok: true });
    },
  });

  await client.showText('XCB.0499', { color: '#00E676', icon: 'abc123' });

  assert.equal(JSON.parse(calls[0].options.body).icon, 'abc123');
});

test('createAwtrixClient surfaces non-OK HTTP responses', async () => {
  const client = createAwtrixClient({
    baseUrl: 'http://tc001.local',
    appName: 'xcb_ctn_prices',
    fetchImpl: async () => new Response('bad request', { status: 400 }),
  });

  await assert.rejects(() => client.showText('XCB.0499'), /AWTRIX request failed/);
});
