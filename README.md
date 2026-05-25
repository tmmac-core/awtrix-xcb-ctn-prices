# awtrix-xcb-ctn-prices

A small Node.js service that fetches live XCB and CTN prices from Ping Exchange and pushes them as rotating frames to an AWTRIX-powered Ulanzi TC001.

## Why this stack

- **Node.js, no framework:** fetch, timers, and HTTP POSTs are all that's needed.
- **Ping Exchange as default:** provides live `xcb_usdc` and `ctn_usdc` prices with no API key required.
- **AWTRIX HTTP Custom App:** `POST /api/custom?name=...` creates a persistent page in the display loop — no stacking, no manual dismissal.
- **Text only:** no icons, no currency symbols, no padding. Prices are trimmed to fit a 32×8 display.
- **PM2 optional:** useful for always-on setups on a Mini-PC or similar.

## Requirements

- Node.js 20 or later
- Ulanzi TC001 on the same network
- AWTRIX 3, AWTRIX Light, or compatible SVITRIX firmware on the TC001
- IP address or hostname of the TC001

## Setup

```bash
cp .env.example .env
```

Then set at minimum:

```bash
TC001_HOST=tc101.local
```

`TC001_HOST` accepts a hostname or IP. A full `http://` URL works too and is normalized internally.

## Running

Dry run (no display update):

```bash
TC001_HOST=127.0.0.1 node src/index.js --once --dry-run
```

Single update:

```bash
node src/index.js --once
```

Continuous loop:

```bash
npm start
```

PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## Show prices only

The service rotates XCB, CTN, and a change frame on its own. To prevent AWTRIX native apps (time, temperature, humidity, battery) from appearing between frames, disable them via the settings API:

```bash
curl -X POST "http://$TC001_HOST/api/settings" \
  -H "Content-Type: application/json" \
  --data '{"TIM":false,"DAT":false,"HUM":false,"TEMP":false,"BAT":false,"ATIME":15}'

curl -X POST "http://$TC001_HOST/api/reboot"
```

A reboot is required for AWTRIX to remove native apps from the loop.

## Configuration

| Variable | Default | Description |
|---|---:|---|
| `TC001_HOST` | required | IP or hostname of the TC001 |
| `AWTRIX_APP_NAME` | `xcb_ctn_prices` | AWTRIX custom app name |
| `DISPLAY_ROTATION_SECONDS` | `15` | Seconds per price frame |
| `PRICE_REFRESH_SECONDS` | `60` | Price fetch interval in seconds |
| `REQUEST_TIMEOUT_MS` | `8000` | Timeout for price and display requests (ms) |
| `PRICE_API_XCB` | Ping `xcb_usdc` | XCB price endpoint |
| `PRICE_API_CTN` | Ping `ctn_usdc` | CTN price endpoint |
| `BRIGHTNESS_DAY` | `120` | Display brightness during the day (0–255) |
| `BRIGHTNESS_NIGHT` | `20` | Display brightness at night (0–255) |
| `DIM_START_HOUR` | `21` | Hour (0–23) when night brightness kicks in |
| `DIM_END_HOUR` | `7` | Hour (0–23) when day brightness resumes |
| `CHANGE_DISPLAY_SECONDS` | `9` | Duration of the change frame in seconds |
| `CHANGE_SCROLL_SPEED` | `50` | Change frame scroll speed (ms/pixel, higher = slower) |

## Verify

```bash
npm test
npm run verify
```

`npm run verify` runs the tests, fetches live prices from Ping Exchange, and outputs the first display frame as a dry run.

## Error handling

- Empty or zero price from the API: discarded, previous price is kept.
- API or AWTRIX HTTP timeout: error is logged.
- On loop errors: the service attempts to show `PRICE ERR` in red on the display.
- Price frames use `noScroll: true` to prevent scrolling on short text.
- The custom app uses `lifetime: 120` and `lifetimeMode: 1` so a stale display becomes visible if updates stop.

## Sources

- AWTRIX/SVITRIX Custom Apps: `POST /api/custom?name=...` with fields like `text`, `color`, `lifetime`, `lifetimeMode`.
- Native AWTRIX apps: disabled via `POST /api/settings`, requires reboot to take effect.
- Ping Exchange market data: `/marketdata/api/v1/tickers?symbol=xcb_usdc` and `ctn_usdc`.
