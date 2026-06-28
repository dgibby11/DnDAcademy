# TT Adventure Sessionbook

## Project Summary
A local, static, single-page web app for running a long-form D&D campaign set at
F.U.C.K.S. (Faculty of Unrestricted Combat, Kinetics, and Sorcery). The campus
map is the centerpiece and launchpad, but the app is a **DM campaign dossier**: a
cross-linked, searchable web of typed **entities** (locations, NPCs, factions,
items, creatures, mysteries, sessions). Clicking a map hotspot or a menu/search
entry opens a stylized parchment modal that renders the entity's content (HTML,
image, or PDF). No backend, no build step — runs from a trivial static server.

## Tech Constraints
- Plain HTML/CSS/JS only. No frameworks, no npm dependencies, no build tooling.
- Works fully offline for all OWN content (data + content files are local).
  The one exception: per-entity external reference `links` (e.g. D&D Beyond stat
  blocks) open the live web when the DM clicks them — these won't work offline,
  by design. The app itself never calls an API or fetches remote data on its own.
- Persistent campaign state (DM notes, "revealed to players" flags, view mode)
  lives in the browser's `localStorage` — no server needed.
- Runs via a trivial static server (bundled `start-map.bat` → Python http.server).
  NOTE: double-clicking index.html does NOT work — browsers block fetch() of local
  files over file://, and the app fetches JSON + content fragments.
- Typography: default to compact sizing everywhere. No large fonts unless
  explicitly requested. Body text ≤ 0.9rem, section headings ≤ 0.85rem,
  labels/badges ≤ 0.7rem. Prefer tighter padding over generous whitespace.
  This applies to both the app chrome (menu, topbar) and modal content.

## Repo Structure
/
├── index.html              # main page (top bar, map, panel, modal mount)
├── start-map.bat           # double-click launcher (Python static server + browser)
├── /css
│   └── style.css           # dark-academia "campus dossier" theme
├── /js
│   ├── data.js             # loads data/index.json + per-type files → window.ENTITIES; app state
│   ├── map.js              # renders clickable hotspot regions for type:"location"
│   ├── menu.js             # slide-out entity menu + DM-mode toggle
│   └── modal.js            # content modal: renders html/image/pdf
├── /data
│   ├── index.json          # MANIFEST: array of the per-type entity files to load
│   ├── locations.json      # entity objects, type:"location"
│   ├── npcs.json           # type:"npc"
│   ├── factions.json       # type:"faction"
│   ├── items.json          # type:"item"
│   ├── creatures.json      # type:"creature"
│   ├── mysteries.json      # type:"mystery"
│   ├── sessions.json       # type:"session"
│   └── references.json     # type:"reference" (campaign overview, resource links)
├── /assets
│   └── FUCKS_map.png       # the base campus map image
├── /content                # one file per entity, named <id>.<ext>
│   ├── <id>.html           # styled content fragment (most entities)
│   └── <id>.[jpg/png/pdf]  # image/PDF entities
└── /tools
    └── coordinate-picker.html  # standalone: click an image, get x/y % for hotspots

## Data Model — Entities (LOCKED SCHEMA)
Every item is an **entity**. Entities are split across per-type files in /data,
all listed in `data/index.json`. `data.js` fetches the manifest, loads each file,
and merges them into `window.ENTITIES`. To add a new type file, add its name to
`index.json` — no code change required.

Each entity object (canonical field order):
{
  "id": "ellery_voss",                  // unique slug across ALL types; = content/<id>.<ext>
  "name": "Dr. Ellery Voss",            // display name
  "type": "npc",                        // location|npc|faction|item|creature|mystery|session|reference
  "category": "Faculty",                // OPTIONAL sub-group within a type (menu sub-header)
  "x": 42.5, "y": 18.2,                 // OPTIONAL (type:location only) hotspot box CENTRE, %
  "w": 12, "h": 6,                      // OPTIONAL hotspot box size % (defaults 12 x 6)
  "contentType": "html" | "image" | "pdf",
  "contentFile": "content/ellery_voss.html",
  "visibility": "player" | "dm-only",   // intrinsic secrecy (authoring-time)
  "related": ["aldric_voss", "fail_chamber"],   // OPTIONAL cross-links → "Related" in modal
  "links": [                            // OPTIONAL external reference links
    { "label": "Bodak — D&D Beyond", "url": "https://www.dndbeyond.com/monsters/bodak" }
  ],
  "tags": ["founder", "faculty"]        // OPTIONAL — feeds search/filtering
}

Rules:
- Only `type:"location"` entities with BOTH x and y render as map hotspots.
  Everything else is reached via the menu / search.
- `category` is a free-form sub-group used by the menu. The menu groups by
  type, then by category within each type.
- `visibility:"dm-only"` hides the whole entity unless DM mode is on. In addition,
  secret blocks inside an otherwise player-safe content file are wrapped in
  `<div class="dm-only">…</div>` (and `.dm-restricted` for "do not surface" notes).
  The DM/view toggle controls both dm-only entities and dm-only content blocks.

## Cross-link convention (`[[ ]]`)
Inside any content file, reference another entity by id:
- `[[ellery_voss]]`            → link showing the target entity's name
- `[[ellery_voss|Dr. Voss]]`   → link with custom display text
On modal render these become clickable links that open the target entity.
Unknown ids must render visibly "broken" (dimmed/struck) to flag typos or
not-yet-written entries during authoring.

## Runtime state (localStorage)
Authored content is static; campaign progress is runtime state, stored under key
`fucks.campaign.v1`:
{
  "view": "dm" | "player",
  "revealed": { "<entityId>": true },   // what the party has discovered
  "notes":    { "<entityId>": "..." }   // DM scratch notes per entity
}

## View rules (three independent axes)
- `visibility` (authored): player vs dm-only.
- `revealed` (runtime): has the party discovered this entity yet.
- `view` (runtime): who is currently looking.
Resolution:
- **DM view** — everything: dm-only entities + dm-only content blocks + DM tools
  (notes, reveal toggles).
- **Player view (screen-safe)** — only entities that are `visibility:player` AND
  `revealed`; dm-only blocks and all DM chrome hidden.

## Feature status
Built: static shell, hotspot regions, type-grouped Index menu (collapsible by
type → category), modal (html/image/pdf), DM-mode toggle + dm-only blocks,
dossier theme, coordinate picker, per-type entity data model, `[[ ]]` cross-link
rendering + "Related" footer, external "References" section from `links[]`.
Planned (in priority order, agreed with the DM):
1. Live search — instant filter/jump across all entities.
2. Persistent DM state — notes, revealed flags, session log (localStorage).
3. Player vs DM view — screen-safe player mode (DM toggle is the seed).

## Out of Scope (do not build unless explicitly asked)
- No live Google Drive/API calls from the running app (external reference `links`
  that the DM explicitly clicks are the only outbound exception).
- No login/auth of any kind.
- No backend/server/database (localStorage is the only persistence).
- No build tooling (webpack/vite/etc.) — keep it dependency-free.
- No mobile-specific design (desktop/laptop use during sessions; don't break
  basic responsiveness).

## Campaign Setup Requirements
Every campaign.json MUST have `dmPassHash` set to protect DM View from players.
Never leave `dmPassHash` as an empty string in a campaign.json.

Passphrases by campaign:
- **fail-academy**: `Smuckers` → `00afe2303c7382f4c9d96401f5bce99c027c75ba993fada538e039e7c048823f`
- **All other / new campaigns**: `Demo` → `8a2cc0673b1c428315fe84c0138d95c3ddda30baf81e7d9aa821f1ca47098193`
  (placeholder until the DM decides to run it; update to Smuckers when active)

## Content Pipeline (handled outside this repo's runtime)
Lore originates as Google Docs, exported and converted into local files. When a
new entity is added, add BOTH (a) an object in the appropriate /data type file
(creating the file + adding it to index.json if it's a new type) and (b) the
matching /content/<id> file. Use the `[[id]]` convention to cross-link entities
so new lore auto-connects to the existing web.

## Current Status
- Map image: assets/FUCKS_map.png (in place); 13 location hotspots plotted.
- Sources absorbed: FUCKS_Academy_Locations_Guide_v2 + the FUCKS Campaign Bible
  (v1 + v2 reconciled; v2 authoritative).
- Entities: 54 total — 24 locations, 9 NPCs, 2 factions, 3 items, 4 creatures,
  5 mysteries, 4 sessions, 3 reference. Cross-linked via `related` + inline `[[ ]]`.
- Secret Society and the founding "Alumni Society" are merged into one faction
  (id: secret_society). Founders (Aldric Voss, Isolde Orath, Brennan Ashcroft),
  Maren Duskhollow, Crumb, Ellery Voss, Lenny Goldvein exist as NPCs.
- Known authoring stubs: Artificers (placeholder), The Party / The Upper-Classmen
  (await play). The Owlbear D&D Beyond link reuses the Bodak's URL id in the
  source PDF and is likely wrong — verify before relying on it.
- Content: one styled HTML fragment per entity in /content.
