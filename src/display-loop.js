import { formatPriceLine } from './price-client.js';

const PRICE_FRAMES = [
  { key: 'xcb', color: '#46B549' },
  { key: 'ctn', color: '#00B74F' },
  { key: 'change' },
];

export function pickDisplayFrame(prices, index) {
  const frame = PRICE_FRAMES[index % PRICE_FRAMES.length];
  if (frame.key === 'change') {
    return formatChangeFrame(prices);
  }
  return {
    text: formatPriceLine(prices[frame.key]),
    color: frame.color,
    noScroll: true,
  };
}

export function formatChangeFrame(prices) {
  const fmt = (pct) => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const text = `XCB${fmt(prices.xcb.changePercent)} CTN${fmt(prices.ctn.changePercent)}`;
  const avgChange = (prices.xcb.changePercent + prices.ctn.changePercent) / 2;
  return {
    text,
    color: avgChange >= 0 ? '#46B549' : '#FF4444',
    noScroll: false,
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
  changeDisplayMs = 9_000,
  changeScrollSpeed = 50,
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
    const isChangeFrame = PRICE_FRAMES[frameIndex % PRICE_FRAMES.length].key === 'change';
    const frame = pickDisplayFrame(latestPrices, frameIndex);
    frameIndex += 1;
    const opts = { color: frame.color, noScroll: frame.noScroll };
    if (isChangeFrame) opts.scrollSpeed = changeScrollSpeed;
    await awtrixClient.showText(frame.text, opts);
    logger.info(`Displayed ${frame.text}`);
    return isChangeFrame ? changeDisplayMs : displayRotationMs;
  }

  async function runOnce() {
    await refreshPricesIfNeeded(true);
    const frame = pickDisplayFrame(latestPrices, 0);
    await awtrixClient.showText(frame.text, { color: frame.color });
  }

  async function start() {
    logger.info(`Starting display loop: rotate every ${displayRotationMs}ms, refresh prices every ${priceRefreshMs}ms`);
    while (!stopped) {
      let sleepMs = displayRotationMs;
      try {
        sleepMs = await showNextFrame();
      } catch (error) {
        logger.error(`Display loop error: ${error.message}`);
        try {
          await awtrixClient.showText('PRICE ERR', { color: '#FF1744', lifetime: 60 });
        } catch (awtrixError) {
          logger.error(`Unable to show error on AWTRIX: ${awtrixError.message}`);
        }
      }
      await sleep(sleepMs);
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
