import { formatPriceLine } from './price-client.js';

const FRAMES = [
  { key: 'xcb', color: '#46B549' },
  { key: 'ctn', color: '#00B74F' },
];

export function pickDisplayFrame(prices, index) {
  const frame = FRAMES[index % FRAMES.length];
  return {
    text: formatPriceLine(prices[frame.key]),
    color: frame.color,
  };
}

function isNightHour(startHour, endHour) {
  const hour = new Date().getHours();
  return hour >= startHour || hour < endHour;
}

export function createDisplayLoop({
  priceClient,
  awtrixClient,
  displayRotationMs = 10_000,
  priceRefreshMs = 60_000,
  brightnessDay = 120,
  brightnessNight = 20,
  dimStartHour = 21,
  dimEndHour = 7,
  logger = console,
}) {
  let latestPrices = null;
  let lastRefresh = 0;
  let frameIndex = 0;
  let stopped = false;
  let activeBrightness = null;

  async function refreshPricesIfNeeded(force = false) {
    const now = Date.now();
    if (!force && latestPrices && now - lastRefresh < priceRefreshMs) {
      return;
    }

    latestPrices = await priceClient.fetchPrices();
    lastRefresh = now;
    logger.info(`Prices refreshed at ${latestPrices.fetchedAt?.toISOString?.() || new Date(now).toISOString()}`);
  }

  async function applyBrightnessIfNeeded() {
    const targetBrightness = isNightHour(dimStartHour, dimEndHour) ? brightnessNight : brightnessDay;
    if (targetBrightness === activeBrightness) return;
    await awtrixClient.setBrightness(targetBrightness);
    activeBrightness = targetBrightness;
    logger.info(`Brightness set to ${targetBrightness} (${targetBrightness === brightnessNight ? 'night' : 'day'})`);
  }

  async function showNextFrame() {
    await refreshPricesIfNeeded(!latestPrices);
    await applyBrightnessIfNeeded();
    const frame = pickDisplayFrame(latestPrices, frameIndex);
    frameIndex += 1;
    await awtrixClient.showText(frame.text, { color: frame.color });
    logger.info(`Displayed ${frame.text}`);
  }

  async function runOnce() {
    await refreshPricesIfNeeded(true);
    const frame = pickDisplayFrame(latestPrices, 0);
    await awtrixClient.showText(frame.text, { color: frame.color });
  }

  async function start() {
    logger.info(`Starting display loop: rotate every ${displayRotationMs}ms, refresh prices every ${priceRefreshMs}ms`);
    while (!stopped) {
      try {
        await showNextFrame();
      } catch (error) {
        logger.error(`Display loop error: ${error.message}`);
        try {
          await awtrixClient.showText('PRICE ERR', { color: '#FF1744', lifetime: 60 });
        } catch (awtrixError) {
          logger.error(`Unable to show error on AWTRIX: ${awtrixError.message}`);
        }
      }
      await sleep(displayRotationMs);
    }
  }

  return {
    runOnce,
    start,
    stop() {
      stopped = true;
    },
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
