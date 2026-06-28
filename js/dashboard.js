// dashboard.js — Location-centric 4-quadrant dashboard.
//
// Layout (always 2×2):
//   TL: Locations   — campus locations (root) or related locations
//   TR: People      — NPCs by category, Creatures, Factions
//   BL: Environment — atmosphere text from entity.environment + related items
//   BR: Curiosities — entity.curiosities roll-entries + Mysteries + DM Notes
//
// Data hooks on location entities (all optional):
//   environment: { architecture, activity, sensory, flora, lighting, weather }
//   curiosities: [{ roll: "Perception DC 14", detail: "…" }, …]
//
// Forward + reverse relationship lookup populates People/Environment/Curiosities
// from the entity graph automatically — no duplication needed.

(function () {

  // ── Data helpers ──────────────────────────────────────────────────────────

  // Union of forward (loc.related[]) and reverse (entities that point to loc).
  function getGraph(locationId) {
    const loc = window.App.byId(locationId);
    if (!loc) return [];
    const forward = (loc.related || [])
      .map((id) => window.App.byId(id))
      .filter((e) => e && e.id !== locationId && window.App.isVisible(e));
    const seen = new Set(forward.map((e) => e.id));
    for (const e of window.ENTITIES) {
      if (e.id === locationId || seen.has(e.id) || !window.App.isVisible(e)) continue;
      if ((e.related || []).includes(locationId)) { seen.add(e.id); forward.push(e); }
    }
    return forward;
  }

  function groupBy(arr, key) {
    const out = {};
    for (const item of arr) { const k = item[key] || ''; (out[k] = out[k] || []).push(item); }
    return out;
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls)            n.className   = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // A quadrant: header title bar + scrollable body. Returns the element;
  // content is added to .quad.body.
  function makeQuad(title, extraClass) {
    const quad  = el('div', 'dash-quad' + (extraClass ? ' ' + extraClass : ''));
    quad.appendChild(el('div', 'dash-quad-header', title));
    const body  = el('div', 'dash-quad-body');
    quad.appendChild(body);
    quad.body   = body;
    return quad;
  }

  // A labelled sub-group within a quad body.
  function makeSubSection(title) {
    const sec = el('div', 'dash-subsection');
    sec.appendChild(el('div', 'dash-subsection-title', title));
    return sec;
  }

  function makeEmpty(msg) { return el('p', 'dash-empty', msg); }

  // ── Card renderers ────────────────────────────────────────────────────────

  function makeEntityCard(entity) {
    const card = el('div', 'dash-entity-card');
    if (entity.visibility === 'dm-only') card.classList.add('dash-entity-dm');
    const link = el('a', 'dash-entity-name', entity.name);
    link.href = '#';
    link.addEventListener('click', (e) => { e.preventDefault(); window.openLocationModal(entity); });
    card.appendChild(link);
    if (entity.category) card.appendChild(el('span', 'dash-entity-cat', entity.category));
    return card;
  }

  function makeLocCard(loc) {
    const card = el('div', 'dash-loc-card');
    card.title = 'Enter ' + loc.name;
    const name = el('span', 'dash-loc-card-name', loc.name);
    card.appendChild(name);
    if (loc.category) card.appendChild(el('span', 'dash-loc-card-cat', loc.category));
    const count = (loc.related || []).length;
    if (count) card.appendChild(el('span', 'dash-loc-card-hint', count + ' linked'));
    card.addEventListener('click', () => window.App.setCurrentLocation(loc.id));
    return card;
  }

  // ── Quadrant builders ─────────────────────────────────────────────────────

  // Preferred category order for the campus root locations quadrant.
  const LOC_CAT_ORDER = [
    'Departments',
    'Central Campus Facilities',
    'Special Facilities',
    'Underground Infrastructure',
    'Remote Field Sites',
    'Founding-Era & Lore',
    'Nearby World',
  ];

  function makeLocationsQuad(graphLocs) {
    const quad   = makeQuad('Locations');
    const groups = groupBy(graphLocs, 'category');
    const keys   = [
      ...LOC_CAT_ORDER.filter((k) => groups[k]),
      ...Object.keys(groups).filter((k) => !LOC_CAT_ORDER.includes(k)).sort(),
    ];

    if (!keys.length) {
      quad.body.appendChild(makeEmpty('No locations linked. Add location ids to the related[] array on this entity.'));
      return quad;
    }
    for (const cat of keys) {
      const sec = makeSubSection(cat || 'Locations');
      const sorted = [...groups[cat]].sort((a, b) => a.name.localeCompare(b.name));
      for (const loc of sorted) sec.appendChild(makeLocCard(loc));
      quad.body.appendChild(sec);
    }
    return quad;
  }

  function makePeopleQuad(entities) {
    const quad     = makeQuad('People & Creatures');
    const npcs     = entities.filter((e) => e.type === 'npc');
    const creatures= entities.filter((e) => e.type === 'creature');
    const factions = entities.filter((e) => e.type === 'faction');
    let any = false;

    const byName = (a, b) => a.name.localeCompare(b.name);
    if (npcs.length) {
      any = true;
      const groups = groupBy(npcs, 'category');
      for (const cat of Object.keys(groups).sort()) {
        const sec = makeSubSection(cat || 'People');
        for (const e of [...groups[cat]].sort(byName)) sec.appendChild(makeEntityCard(e));
        quad.body.appendChild(sec);
      }
    }
    if (creatures.length) {
      any = true;
      const sec = makeSubSection('Creatures');
      for (const e of [...creatures].sort(byName)) sec.appendChild(makeEntityCard(e));
      quad.body.appendChild(sec);
    }
    if (factions.length) {
      any = true;
      const sec = makeSubSection('Factions');
      for (const e of [...factions].sort(byName)) sec.appendChild(makeEntityCard(e));
      quad.body.appendChild(sec);
    }
    if (!any) quad.body.appendChild(makeEmpty('No people or creatures linked to this location.'));
    return quad;
  }

  function makeEnvironmentQuad(loc, graphItems) {
    const quad  = makeQuad('Environment', 'quad-environment');
    const env   = loc?.environment;
    const items = graphItems.filter((e) => e.type === 'item');
    let any = false;

    if (env) {
      any = true;
      const FIELDS = [
        ['architecture', 'Architecture'],
        ['activity',     'Activity'    ],
        ['sensory',      'Sensory'     ],
        ['flora',        'Flora'       ],
        ['lighting',     'Lighting'    ],
        ['weather',      'Weather'     ],
      ];
      for (const [key, label] of FIELDS) {
        if (!env[key]) continue;
        const block = el('div', 'env-block');
        block.appendChild(el('div', 'env-label', label));
        block.appendChild(el('p',   'env-text',  env[key]));
        quad.body.appendChild(block);
      }
    }

    if (items.length) {
      any = true;
      const sec = makeSubSection('Notable Objects');
      for (const e of items) sec.appendChild(makeEntityCard(e));
      quad.body.appendChild(sec);
    }

    if (!any) {
      quad.body.appendChild(makeEmpty(
        'Add an "environment" object to this location\'s JSON to describe what the party sees, hears, and smells. ' +
        'Keys: architecture · activity · sensory · flora · lighting · weather'
      ));
    }
    return quad;
  }

  function timeVisible(entry) {
    if (!entry.time || !entry.time.length) return true;
    return entry.time.includes(window.App.getTimeOfDay());
  }

  function makeCuriositiesQuad(loc, graphEntities) {
    const quad       = makeQuad('Curiosities', 'quad-curiosities');
    const allCuriosities = loc?.curiosities || [];
    const curiosities    = allCuriosities.filter(timeVisible);
    const mysteries  = graphEntities.filter((e) => e.type === 'mystery');
    const sessions   = graphEntities.filter((e) => e.type === 'session');
    let any = false;

    if (curiosities.length) {
      any = true;
      const sec = makeSubSection('Observations');
      for (const c of curiosities) {
        const row = el('div', 'curiosity-item');
        if (c.roll) row.appendChild(el('span', 'curiosity-roll', c.roll));
        row.appendChild(el('p', 'curiosity-detail', c.detail));
        sec.appendChild(row);
      }
      quad.body.appendChild(sec);
    }

    const byName = (a, b) => a.name.localeCompare(b.name);
    if (mysteries.length) {
      any = true;
      const sec = makeSubSection('Mysteries');
      for (const e of [...mysteries].sort(byName)) sec.appendChild(makeEntityCard(e));
      quad.body.appendChild(sec);
    }
    if (sessions.length) {
      any = true;
      const sec = makeSubSection('Sessions');
      for (const e of [...sessions].sort(byName)) sec.appendChild(makeEntityCard(e));
      quad.body.appendChild(sec);
    }

    if (!any) {
      quad.body.appendChild(makeEmpty(
        'Add a "curiosities" array to this location\'s JSON for perception/insight discoveries. ' +
        'Each entry: { "roll": "Perception DC 14", "detail": "…" }'
      ));
    }

    // DM notes appear at the bottom of Curiosities when a specific location is active.
    if (window.App.isDM() && loc) {
      const sec = makeSubSection('DM Notes');
      sec.classList.add('dash-notes-section');
      const ta = el('textarea', 'dash-notes-ta');
      ta.placeholder = 'Session notes for this location…';
      ta.value = window.App.getNote(loc.id);
      let timer;
      ta.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => window.App.setNote(loc.id, ta.value), 400);
      });
      sec.appendChild(ta);
      quad.body.appendChild(sec);
    }

    return quad;
  }

  // ── Header ────────────────────────────────────────────────────────────────

  function makeHeader(isRoot, loc) {
    const hdr = el('div', 'dash-location-header');

    if (!isRoot) {
      const back = el('button', 'loc-bar-back', '← Home');
      back.addEventListener('click', () => window.App.clearLocation());
      hdr.appendChild(back);
    }

    hdr.appendChild(el('h2', 'dash-location-title', isRoot ? window.CAMPAIGN.name : loc.name));

    const meta = el('div', 'dash-location-meta');
    const subtitle = window.CAMPAIGN.subtitle || '';
    meta.textContent = isRoot
      ? (subtitle ? subtitle + ' — select a location to enter it' : 'Select a location to enter it')
      : (['LOCATION', loc && loc.category].filter(Boolean).join(' · '));
    hdr.appendChild(meta);

    hdr.appendChild(makeTimeToggle());

    if (!isRoot && loc && loc.contentFile) {
      const btn = el('button', 'dash-detail-btn', 'Full Entry →');
      btn.addEventListener('click', () => window.openLocationModal(loc));
      hdr.appendChild(btn);
    }
    return hdr;
  }

  // ── Time of day ───────────────────────────────────────────────────────────

  const TIME_SLOTS = [
    { id: 'dawn',  label: '◐ Dawn'  },
    { id: 'day',   label: '○ Day'   },
    { id: 'dusk',  label: '◑ Dusk'  },
    { id: 'night', label: '● Night' },
  ];

  function makeTimeToggle() {
    const wrap = el('div', 'loc-bar-time');
    const current = window.App.getTimeOfDay();
    for (const slot of TIME_SLOTS) {
      const btn = el('button', 'loc-time-btn' + (slot.id === current ? ' loc-time-active' : ''), slot.label);
      btn.dataset.time = slot.id;
      btn.addEventListener('click', () => {
        if (window.App.getTimeOfDay() !== slot.id) window.App.setTimeOfDay(slot.id);
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }

  // ── Region map ────────────────────────────────────────────────────────────

  function makeRegionMap() {
    const entityId = window.CAMPAIGN.regionMapEntity;
    if (!entityId) return null;
    const entity = window.App.byId(entityId);
    if (!entity || !window.App.isVisible(entity)) return null;
    const src  = window.CAMPAIGN_BASE + '/' + entity.contentFile;
    const wrap = el('div', 'dash-region-map');
    wrap.title = 'Click to open — ' + entity.name;
    wrap.style.cursor = 'zoom-in';
    const img = el('img');
    img.src = src;
    img.alt = entity.name;
    wrap.appendChild(img);
    wrap.addEventListener('click', () => window.openImageModal(src, entity.name));
    return wrap;
  }

  // ── Main render ───────────────────────────────────────────────────────────

  function render() {
    const dash = document.getElementById('dashboard');
    if (!dash) return;

    const ROOT      = window.CAMPAIGN.rootLocation;
    const currentId = window.App.getCurrentLocationId() || ROOT;
    const loc       = window.App.byId(currentId);
    const isRoot    = currentId === ROOT;
    const graph     = getGraph(currentId);

    dash.innerHTML = '';
    dash.appendChild(makeHeader(isRoot, loc));

    const quads  = el('div', 'dash-quadrants');

    const topRow = el('div', 'dash-row');
    topRow.appendChild(makeLocationsQuad(graph.filter((e) => e.type === 'location')));
    topRow.appendChild(makePeopleQuad(graph));
    quads.appendChild(topRow);

    const botRow = el('div', 'dash-row');
    botRow.appendChild(makeEnvironmentQuad(loc, graph));
    if (isRoot && window.CAMPAIGN.regionMapEntity) {
      const mapEl = makeRegionMap();
      if (mapEl) botRow.appendChild(mapEl);
    }
    botRow.appendChild(makeCuriositiesQuad(loc, graph));
    quads.appendChild(botRow);

    dash.appendChild(quads);
  }

  document.addEventListener('entities:ready',   render);
  document.addEventListener('location:changed', render);
  document.addEventListener('dm:changed',       render);
  document.addEventListener('campaign:changed', render);
  document.addEventListener('time:changed',     render);
})();
