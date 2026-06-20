# F.U.C.K.S. Academy — Interactive Campus Map

A local, static, offline single-page app that displays the campus map of
**F.U.C.K.S.** (Faculty of Unrestricted Combat, Kinetics, and Sorcery) with
clickable hotspots over each location. See [CLAUDE.md](CLAUDE.md) for the full
project spec.

## How to run

Double-click **`start-map.bat`**. It launches a tiny local web server (Python)
and opens the map at <http://localhost:8000/> in your browser.

- A window titled **"FUCKS server"** stays open while the app runs — **close it
  to stop the server.**
- Requires Python (the `py` launcher or `python` on PATH). Already present on the
  dev machine (Python 3.14).

> Why a server instead of just opening `index.html`? Browsers block local
> `fetch()` of JSON/HTML files over `file://`, which the app uses to load
> location data and content. The tiny server sidesteps that. It serves only
> local files — nothing leaves your machine.

## Manual launch (alternative)

From this folder:

```
py -m http.server 8000
```

Then open <http://localhost:8000/>.
