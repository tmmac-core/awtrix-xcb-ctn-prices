import { formatPriceLine } from './price-client.js';

const FRAMES = [
  { key: 'xcb', color: '#00E676' },
  { key: 'ctn', color: '#FF9800' },
];

export function pickDisplayFrame(prices, index, icons = {}) {
  const frame = FRAMES[index % FRAMES.length];
  const displayFrame = {
    text: formatPriceLine(prices[frame.key]),
    color: frame.color,
  };

  if (icons[frame.key]) {
    displayFrame.icon = icons[frame.key];
  }

  return displayFrame;
}

export function createDisplayLoop({
  priceClient,
  awtrixClient,
  displayRotationMs = 10_000,
  priceRefreshMs = 60_000,
  logger = console,
  icons = {},
}) {
  let latestPrices = null;
  let lastRefresh = 0;
  let frameIndex = 0;
  let stopped = false;

  async function refreshPricesIfNeeded(force = false) {
    const now = Date.now();
    if (!force && latestPrices && now - lastRefresh < priceRefreshMs) {
      return;
    }

    latestPrices = await priceClient.fetchPrices();
    lastRefresh = now;
    logger.info(`Prices refreshed at ${latestPrices.fetchedAt?.toISOString?.() || new Date(now).toISOString()}`);
  }

  async function showNextFrame() {
    await refreshPricesIfNeeded(!latestPrices);
    const frame = pickDisplayFrame(latestPrices, frameIndex, icons);
    frameIndex += 1;
    await awtrixClient.showText(frame.text, { color: frame.color, icon: frame.icon });
    logger.info(`Displayed ${frame.text}`);
  }

  async function runOnce() {
    await refreshPricesIfNeeded(true);
    const frame = pickDisplayFrame(latestPrices, 0, icons);
    await awtrixClient.showText(frame.text, { color: frame.color, icon: frame.icon });
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
