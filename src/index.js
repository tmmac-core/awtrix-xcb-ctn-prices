#!/usr/bin/env node

import { createAwtrixClient } from './awtrix-client.js';
import { readConfig } from './config.js';
import { createDisplayLoop } from './display-loop.js';
import { loadEnvFile } from './env-file.js';
import { createPriceClient } from './price-client.js';

loadEnvFile();

const args = new Set(process.argv.slice(2));
const once = args.has('--once');
const dryRun = args.has('--dry-run');

const config = readConfig(process.env);
const priceClient = createPriceClient({
  xcbUrl: config.xcbUrl,
  ctnUrl: config.ctnUrl,
  requestTimeoutMs: config.requestTimeoutMs,
});
const awtrixClient = dryRun
  ? createDryRunAwtrixClient()
  : createAwtrixClient({
    baseUrl: config.awtrixBaseUrl,
    appName: config.appName,
    requestTimeoutMs: config.requestTimeoutMs,
  });

const loop = createDisplayLoop({
  priceClient,
  awtrixClient,
  displayRotationMs: config.displayRotationMs,
  priceRefreshMs: config.priceRefreshMs,
  brightnessDay: config.brightnessDay,
  brightnessNight: config.brightnessNight,
  dimStartHour: config.dimStartHour,
  dimEndHour: config.dimEndHour,
});

try {
  if (once) {
    await loop.runOnce();
  } else {
    await loop.start();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function createDryRunAwtrixClient() {
  return {
    async setBrightness(value) {
      console.log(`[dry-run] setBrightness(${value})`);
    },
    async showText(text, options) {
      console.log(`[dry-run] ${text} ${JSON.stringify(options)}`);
    },
  };
}
