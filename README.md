# FAIL Academy — Campaign Dossier

A local, static, offline single-page app for running a long-form D&D campaign set at **FAIL Academy** (Faculty of Arms, Inquiry & Lore). The campus map is the centrepiece, but the app is a full DM dossier: a cross-linked, searchable web of typed entities — locations, NPCs, factions, items, creatures, mysteries, and sessions. Clicking a map hotspot or an Index entry opens a styled modal with the entity's content.

## How to run

Double-click **`start-map.bat`**. It launches a tiny local web server (Python) and opens the app at <http://localhost:8000/> in your browser.

- A window titled **"FAIL server"** stays open while the app runs — **close it to stop the server.**
- Requires Python (the `py` launcher or `python` on PATH).

> **Why a server?** Browsers block local `fetch()` of JSON/HTML over `file://`. The server sidesteps that. It serves only local files — nothing leaves your machine.

## Manual launch

```
py -m http.server 8000
```

Then open <http://localhost:8000/>.

---

## Roadmap & Backlog

### Done
- [x] Campus map with invisible clickable hotspots over department banners
- [x] Slide-out Index panel — all entities grouped by type, collapsible
- [x] Modal system (HTML, image, PDF content types)
- [x] Dark-academia "campus dossier" theme
- [x] DM Mode toggle — reveals dm-only entities and content blocks
- [x] `[[cross-link]]` resolution inside content, Related footer
- [x] External links bar at top of each modal
- [x] Live search — topbar input, `/` shortcut, keyboard navigation
- [x] Persistent DM state — per-entity notes and "revealed to players" flags (localStorage)
- [x] Player character entries — Lugeiros Serise, Gunnar, Caelum Rivenstone, BloodRaven (full stat blocks + D&D Beyond links)
- [x] FAIL Academy rename (formerly F.U.C.K.S.)
- [x] Menu stays open when a modal is open
- [x] Coordinate picker tool (`tools/coordinate-picker.html`)
- [x] **Campus store + credits system** — The Provisions Office ("The Prov"), run by Silas Morne; full credits economy (100 AC/year; 50 AC potions, cap 2/year; black market at 100 gp; Special Acquisitions magical inventory)

### In Progress / Next Up
- [ ] **Player vs DM view** — screen-safe player mode: only revealed, player-visible entities shown; all DM chrome hidden
- [ ] **Party overview page** — side-by-side summary of all four PCs linking to their individual entries and D&D Beyond sheets

### Backlog
- [ ] **Richer PC popups** — full saving throws, complete equipment lists, better spell layout
- [ ] **More lore** — legends & myths, extended faculty roster (best/worst professors), student clubs, academic calendar and traditions
- [ ] **Nearby world content** — Silverymoon, River Rauvin, High Forest, regional settlements, roads and ruins; D&D Beyond sourcebook links where available
- [ ] **More D&D Beyond creature links** — audit and fill in correct monster URLs for existing creatures (Owlbear URL flagged as likely wrong); add wilderness encounter creatures
- [ ] **Random generator** — generate NPCs and magic items on the fly; persist via localStorage + File System Access API write + export fallback
