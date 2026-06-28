# DnDAcademy — Roadmap & Feature Backlog

Living document. Reprioritize freely. Add notes under each item as thinking evolves.

---

## Priority Queue

### ~~0a. Tests — Part 1: Data Integrity (Python)~~ ✅ Done
**Command:** `python tools/test.py` — also runs automatically from `start-map.bat`

44 checks across all registered campaigns: JSON parse validity, required entity fields, duplicate IDs, `related[]` resolution, `contentFile` existence on disk, `[[id]]` cross-link resolution, `dmPassHash` presence, and `fail-academy` registry exclusion. Failures print and set a non-zero exit code; server still starts.

**Also fixed during implementation:**
- `descent-into-avernus/data/index.json` — filenames were missing `.json` extensions; `references` was listed twice
- `curse-of-strahd` — `abbey_of_saint_markovia` existed in both `locations.json` and `factions.json`; faction renamed to `abbey_of_saint_markovia_faction`

---

### ~~0b. Tests — Part 2: JS Unit Tests (Browser)~~ ✅ Done
**URL:** `http://localhost:8000/tools/tests.html` (server must be running)

No campaign needed — mocks are inline. Approach: `window._genTest` added to the end of `generator.js`; `window._modalTest` added to end of `modal.js`. Non-breaking; easy to audit.

**Covers:**
- `generateNPC()` — required fields, `_meta`, unique ids, 200-roll secret probability
- Seeding — name override, gender pronouns, race recorded in `_meta`
- `rollOccupation()` — category/role always valid; common categories outnumber rare over 500 rolls
- `generateItem()` — required fields, rarity always one of four valid tiers (20 rolls)
- `mergeExt()` — append vs. replace; `_`-prefixed keys never written to T
- `makeLink()` — known id → `<a>`; unknown → `<span class="xlink-broken">`; custom labels honored
- `resolveCrossLinks()` — `[[id]]` and `[[id|label]]` replaced in DOM; broken ids show as broken spans; surrounding text preserved

---

### ~~1. Dice Roller — Multi-d20 Display (Advantage / Disadvantage)~~ ✅ Done

Auto-detect approach: any multi-roll of d20 shows individual die values side-by-side in both the stage and history; no sum shown. All other dice (2d6, etc.) still show a total. No UI decision needed during play.

---

### ~~2. NPC Generator — Quick Mode (Townsfolk / Shopkeeper)~~ ✅ Done

**⚡ Quick NPC** button in the topbar — one click opens a compact floating card. No form. Shows name, race/gender/occupation, one appearance note, one personality trait in italics. Re-roll generates a fresh NPC; Save persists it to the generator's saved list (same as full generator). Esc or click-outside dismisses. Full generator unchanged at `⚄ Generate`.

---

## Icebox (easiest → hardest)

- ~~**Remove dashboard subtitle**~~ ✅ Done — stripped from `makeHeader()`; was a one-line fix.
- ~~**Location bar → dashboard header**~~ ✅ Already done — `#location-bar` no longer exists; back button, time toggle, and Full Entry are all inline in `makeHeader()`.
- **App rename** — the tool has outgrown the "FAIL Academy" concept and is now a general D&D campaign dossier. Pick a new name; mechanical find/replace across HTML/JS/CSS.
- **5e-bits API research** — evaluate https://5e-bits.github.io/docs/ for integration opportunities: spell lookup, monster stat blocks, equipment, classes/spells by level. Pure research, no code. Any API use must be gracefully optional (DM explicitly triggers; fails silently offline).
- **Search improvements** — tag-based filtering, fuzzy match on existing search UI.
- **Persistent DM state** — notes, revealed flags, session log (partially done via localStorage; needs UI to expose it cleanly).
- **Session runner image panel** — split bottom of session runner into thirds; center panel cycles images (← →) linked to the session. Entity portrait rendering via `contentType:"image"` is already done; this is the session runner layout + content pipeline. Medium effort.
- **Random generator expansion** — extend beyond NPC/item: encounter tables, weather, rumors, names.
- **Player vs DM view** — full screen-safe player mode; DM toggle exists but content gating is not fully built out.
- **Import process overhaul** — CoS and DiA are sparse stubs; define content standard per entity type, richer templates, semi-automate Google Doc → JSON+HTML stub. Tackle one campaign at a time. Large effort.
- **Party overview page** — new panel/page: track party members, HP, conditions, inventory. Needs a data model and persistent state.

---

## Completed

- **Quick NPC** — topbar `⚡ Quick NPC` button; one-click compact card: name, race/occupation, appearance, trait; Re-roll + Save
- **Dice roller multi-d20** — 2+ d20s show individual values (advantage/disadvantage); other dice still sum
- **JS unit tests** (`tools/tests.html`) — 22 browser tests: generator logic, modal cross-link rendering
- **Data integrity test suite** (`tools/test.py`) — 44 checks, auto-runs on server launch
- Multi-campaign support with launcher and registry gating
- NPC generator (full mode) with race-specific names, weighted occupations, optional secrets
- Animated dice roller with d4–d100 support and throw animation
- Session runner panel
- Dashboard with 4-quadrant location view
- Entity cross-links (`[[id]]`) and related entity graph
- DM mode toggle with dm-only block support
