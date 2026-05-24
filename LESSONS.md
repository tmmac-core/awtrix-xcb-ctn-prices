# LESSONS.md

## workspace
- **Regel:** Neue dauerhafte Projekte immer unter `/Users/tmmac/projects/` anlegen, nicht unter `~/Documents/Codex/...`.
- **Kontext:** Der erste Projektordner fuer die Ulanzi-Integration wurde im Codex-Session-Ordner angelegt und musste nach `~/projects/ulanzi-tc001-prices` korrigiert werden.
- **Gilt fuer:** Jedes neue Repo oder Projekt, das Daniel spaeter mit Claude und Codex gemeinsam weiterbearbeiten will.

## display
- **Regel:** Bei AWTRIX/Ulanzi-Text mit `noScroll:true` immer per `/api/screen` pruefen, ob der Text wirklich in 32x8 Pixel passt.
- **Kontext:** `CTN .0068` hatte nur 9 Zeichen, war aber in Pixelbreite zu breit und erschien auf dem Display nur als Strich. `CTN.0068` passte vollstaendig.
- **Gilt fuer:** Jede Aenderung an Preisformat, Labels, Symbolen, Icons oder Textlaenge auf dem TC001.

## privacy
- **Regel:** Echte lokale IPs nur in `.env` oder lokalen Backups speichern; README, `.env.example`, Tests und GitHub nutzen neutrale Hostnamen statt privater Beispiel-IPs.
- **Kontext:** Daniel hat explizit nachgefragt, ob die echte Ulanzi-IP in der README steht. Danach wurden auch private Beispiel-IPs aus README und `.env.example` entfernt, damit keine lokale Adresse im Repo landet.
- **Gilt fuer:** Jede Netzwerk-/IoT-Integration mit lokalen Geraeteadressen.

## shell
- **Regel:** In zsh keine Schleifenvariable `path` verwenden; sie ist mit `PATH` gekoppelt und kann Befehle wie `curl`/`head` unauffindbar machen.
- **Kontext:** Eine Endpoint-Pruefung mit `for path in ...` zerstoerte im Subshell-Kontext die Command-Lookups.
- **Gilt fuer:** Shell-Loops in zsh, besonders bei Netzwerk- und API-Checks.
