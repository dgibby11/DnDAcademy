# TT Adventure Sessionbook

A local, static, offline single-page app for running tabletop RPG campaigns. Each campaign gets its own entity graph — locations, NPCs, factions, items, creatures, mysteries, and sessions — navigable through a 4-quadrant dashboard and searchable index. Clicking any entry opens a styled modal with the entity's content. Built for DMs; runs off a trivial local server.

## How to run

Double-click **`start-map.bat`**. It launches a tiny local web server (Python) and opens the app at <http://localhost:8000/> in your browser.

- A window titled **"TT Adventure Sessionbook"** stays open while the app runs — **close it to stop the server.**
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
- [x] **Player vs DM view** — screen-safe player mode: only revealed + player-visible entities shown in menu/map/search; all DM chrome hidden; green "Player View" badge; toggle re-labels to "◆ DM View / ◯ Player View"
- [x] **Party overview page** — side-by-side PC cards with stats, key features, D&D Beyond links, party capability summary, DM tactical notes
- [x] **More lore content** — Headmistress Dowe, Prof. Thalia Varn (beloved), Prof. Aldous Fenwick (worst); Arcane Dueling Society, Expedition Volunteers, The Dead Hours (underground fight club, dm-only); Academy Traditions & Calendar; Legends of the Academy (Whispering Archive, the Lost Year, Golden Cohort, Last Student, the Room That Moves)
- [x] **Nearby world content** — Silverymoon, River Rauvin, High Forest, Everlund; all cross-linked with Thornwick Consortium hooks
- [x] **More D&D Beyond creature links** — fixed Owlbear URL (was duplicate of Bodak ID); added Wolves/Dire Wolves, Displacer Beast, Orc Warband with tactical profiles and D&D Beyond links

### Backlog
- [ ] **Richer PC popups** — full saving throws, complete equipment lists, better spell layout
- [ ] **Random generator** — generate NPCs and magic items on the fly; persist via localStorage + File System Access API write + export fallback
