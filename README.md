# Ulanzi TC001 XCB/CTN Price Display

Kleiner Node.js-Dienst fuer einen Ulanzi TC001 mit AWTRIX/SVITRIX-Firmware. Der Dienst holt XCB- und CTN-Preise von Ping Exchange und aktualisiert eine AWTRIX-Custom-App im Wechsel.

## Warum dieser Stack

- **Node.js ohne Framework:** reicht fuer Fetch, Timer und HTTP-POSTs. Weniger bewegliche Teile als ein Webserver.
- **Ping Exchange als Default:** dein bestehendes `core-portfolio` nutzt bereits `xcb_usdc` und `ctn_usdc`; die Live-Endpunkte liefern aktuelle Preise ohne API-Key.
- **AWTRIX HTTP Custom App:** `POST /api/custom?name=...` erzeugt eine dauerhafte Seite im Display-Loop. Das ist besser als Notifications, weil nichts gestapelt oder manuell dismissed werden muss.
- **Icons direkt im Payload:** die Core/CTN-Logos liegen als 8x8-JPGs in `assets/` und werden als Base64 im AWTRIX-`icon`-Feld mitgesendet. Dadurch musst du die Icons nicht manuell im AWTRIX-Webinterface hochladen.
- **PM2 optional:** sinnvoll fuer Dauerbetrieb auf Mac mini, Mini-PC oder Hetzner.

## Voraussetzungen

- Node.js 20 oder neuer
- Ulanzi TC001 im selben Netzwerk
- AWTRIX 3, AWTRIX Light oder kompatible SVITRIX-Firmware auf dem TC001
- IP-Adresse des TC001

## Setup

```bash
cd ~/projects/ulanzi-tc001-prices
cp .env.example .env
```

Dann in `.env` mindestens setzen:

```bash
TC001_HOST=192.168.1.50
```

`TC001_HOST` ist nur Host oder IP. `http://192.168.1.50/` funktioniert auch, wird intern normalisiert.

## Start

Einmaliger Test ohne TC001-POST:

```bash
TC001_HOST=127.0.0.1 node src/index.js --once --dry-run
```

Einmaliger echter POST an den TC001:

```bash
node src/index.js --once
```

Dauerbetrieb:

```bash
npm start
```

PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## Konfiguration

| Variable | Default | Bedeutung |
|---|---:|---|
| `TC001_HOST` | erforderlich | IP oder Hostname des TC001 |
| `AWTRIX_APP_NAME` | `xcb_ctn_prices` | Name der AWTRIX-Custom-App |
| `DISPLAY_ROTATION_SECONDS` | `10` | Wechsel zwischen XCB und CTN |
| `PRICE_REFRESH_SECONDS` | `60` | Preisabruf-Intervall |
| `REQUEST_TIMEOUT_MS` | `8000` | Timeout fuer Preis- und Display-Requests |
| `PRICE_API_XCB` | Ping `xcb_usdc` | XCB-Preisquelle |
| `PRICE_API_CTN` | Ping `ctn_usdc` | CTN-Preisquelle |
| `XCB_ICON` | `assets/xcb-8.jpg` als Base64 | Optionaler AWTRIX Icon-Wert fuer XCB |
| `CTN_ICON` | `assets/ctn-8.jpg` als Base64 | Optionaler AWTRIX Icon-Wert fuer CTN |

## Icons

Die mitgelieferten Icons sind fuer die 8x8-Matrix optimiert:

- XCB nutzt ein handgepixeltes 8x8-Core-Ring-Symbol aus `assets/xcb-8-pixel.svg`.
- `https://corecdn.info/mark/256/ctn.svg`

CTN ist aktuell noch aus dem offiziellen SVG auf 8x8 JPG reduziert. Wenn du im AWTRIX-Webinterface eigene bessere Pixel-Icons hochlaedst, kannst du deren Dateinamen oder Icon-ID ueber `XCB_ICON` und `CTN_ICON` setzen.

## Verify

```bash
npm test
npm run verify
```

`npm run verify` fuehrt die Tests aus, holt Live-Preise von Ping Exchange und gibt den ersten Display-Frame als Dry-Run aus.

## Fehlerverhalten

- Preis-API leer oder Preis `0`: wird verworfen.
- Preis-API oder AWTRIX-HTTP Timeout: Fehler wird geloggt.
- Im Loop versucht der Dienst bei Fehlern `PRICE ERR` in Rot anzuzeigen.
- Die AWTRIX-Custom-App nutzt `lifetime: 120` und `lifetimeMode: 1`, damit ein stale Display sichtbar wird, falls keine Updates mehr kommen.

## Quellen

- AWTRIX/SVITRIX Custom Apps nutzen HTTP `POST /api/custom?name=...` und akzeptieren Payload-Felder wie `text`, `color`, `lifetime` und `lifetimeMode`.
- Ping Exchange liefert Marktdaten ueber `/marketdata/api/v1/tickers` fuer Paare wie `xcb_usdc` und `ctn_usdc`.
