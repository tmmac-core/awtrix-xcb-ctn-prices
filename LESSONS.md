# LESSONS.md

## workspace
- **Regel:** Neue dauerhafte Projekte unter `~/projects/` anlegen, nicht in temporaeren Session-Ordnern.
- **Kontext:** Das Projektverzeichnis wurde initial in einem temporaeren Ordner angelegt und musste nach `~/projects/` verschoben werden.
- **Gilt fuer:** Jedes Projekt das dauerhaft weiterbearbeitet werden soll.

## display
- **Regel:** Bei AWTRIX/Ulanzi-Text mit `noScroll:true` immer per `/api/screen` pruefen, ob der Text wirklich in 32x8 Pixel passt.
- **Kontext:** `CTN .0068` hatte nur 9 Zeichen, war aber in Pixelbreite zu breit und erschien auf dem Display nur als Strich. `CTN.0068` passte vollstaendig.
- **Gilt fuer:** Jede Aenderung an Preisformat, Labels, Symbolen, Icons oder Textlaenge auf dem TC001.

## privacy
- **Regel:** Echte lokale IPs nur in `.env` (gitignored) speichern; README, `.env.example`, Tests und Code nutzen neutrale Hostnamen wie `tc001.local` statt privater IPs.
- **Kontext:** Beim ersten Commit waren Beispiel-IPs in README und `.env.example`. Alle Beispiel-IPs wurden durch `tc001.local` ersetzt — der Hostname funktioniert via mDNS und ist kein privates Datum.
- **Gilt fuer:** Jede Netzwerk-/IoT-Integration mit lokalen Geraeteadressen.

## shell
- **Regel:** In zsh keine Schleifenvariable `path` verwenden; sie ist mit `PATH` gekoppelt und kann Befehle wie `curl`/`head` unauffindbar machen.
- **Kontext:** Eine Endpoint-Pruefung mit `for path in ...` zerstoerte im Subshell-Kontext die Command-Lookups.
- **Gilt fuer:** Shell-Loops in zsh, besonders bei Netzwerk- und API-Checks.

## service-conflict
- **Regel:** Immer pruefen ob ein zweiter Service (Mac, anderer Host) auf denselben AWTRIX App-Namen schreibt, bevor Code-Aenderungen am Display als unwirksam abgetan werden.
- **Kontext:** CTN blieb nach dem Update orange — weil der Mac-PM2-Service (alter Code, fehlende Farbanpassung) alle 15s ueberschrieb. Diagnose: beide Services schreiben auf denselben `/api/custom?name=priceWidget` Endpoint; last-write-wins. Fix: Mac-Service stoppen, Linux-Mini-ITX uebernimmt allein.
- **Gilt fuer:** Jede AWTRIX-Deployment-Aenderung wenn mehrere Hosts/Devices im Netz laufen.

## network-discovery
- **Regel:** Wenn mDNS-Hostname (`tc001.local`) nicht aufloest, Netzwerk per Subnet-Scan mit `curl /api/stats` entdecken statt raten.
- **Kontext:** `tc001.local` loest auf Linux-Hosts ohne Avahi-Daemon nicht auf. Subnet-Scan mit Parallel-Requests + Timeout findet das Geraet zuverlaessig. Alternativ: DHCP-Lease im Router nachschlagen oder feste IP vergeben.
- **Gilt fuer:** IoT-Geraete ohne stabilen DHCP-Lease oder mDNS-Support in gemischten Linux/Mac-Netzen.
