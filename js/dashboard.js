// dashboard.js — Location-centric dashboard.
//
// Renders the main content area (#dashboard) based on where the party
// currently is. Two states:
//   • Campus root (no location set) — grid of all campus locations plus
//     quick-access sections for the party, active mysteries, and sessions.
//   • Location view (currentLocationId set) — surfaces all entities
//     related to that location via forward lookup (location.related[]) and
//     reverse lookup (entities whose related[] points back to this location).
//
// Entering a location: click a location card on the root dashboard, or
// click "Enter →" on any location card in a widget.
// Leaving: click "← Campus" in the location bar.

(function () {
  // Widget display labels and render order.
  const TYPE_META = {
    npc:       { label: 'People'            },
    creature:  { label: 'Creatures'         },
    item:      { label: 'Items & Equipment' },
    faction:   { label: 'Factions'          },
    mystery:   { label: 'Plot Threads'      },
    session:   { label: 'Sessions'          },
    location:  { label: 'Nearby Locations'  },
    reference: { label: 'References'        },
  };
  const WIDGET_ORDER = ['npc', 'creature', 'item', 'faction', 'mystery', 'session', 'location', 'reference'];

  // ── Data helpers ────────────────────────────────────────────────────────────

  // Build the full set of entities related to a location: forward links from
  // location.related[] plus reverse links from any entity whose related[] includes
  // this location id. Deduped. Respects current visibility rules.
  function getGraph(locationId) {
    const loc = window.App.byId(locationId);
    if (!loc) return [];

    const forward = (loc.related || [])
      .map((id) => window.App.byId(id))
      .filter((e) => e && e.id !== locationId && window.App.isVisible(e));

    const seen = new Set(forward.map((e) => e.id));

    for (const e of window.ENTITIES) {
      if (e.id === locationId || seen.has(e.id)) continue;
      if (!window.App.isVisible(e)) continue;
      if ((e.related || []).includes(locationId)) {
        seen.add(e.id);
        forward.push(e);
      }
    }
    return forward;
  }

  function groupByType(entities) {
    const groups = {};
    for (const e of entities) {
      (groups[e.type] = groups[e.type] || []).push(e);
    }
    return groups;
  }

  // ── Card / widget builders ──────────────────────────────────────────────────

  function makeEntityCard(entity) {
    const card = document.createElement('div');
    card.className = 'dash-entity-card';
    if (entity.visibility === 'dm-only') card.classList.add('dash-entity-dm');

    const name = document.createElement('a');
    name.className = 'dash-entity-name';
    name.href = '#';
    name.textContent = entity.name;
    name.addEventListener('click', (e) => { e.preventDefault(); window.openLocationModal(entity); });
    card.appendChild(name);

    if (entity.category) {
      const cat = document.createElement('span');
      cat.className = 'dash-entity-cat';
      cat.textContent = entity.category;
      card.appendChild(cat);
    }

    if (entity.type === 'location') {
      const btn = document.createElement('button');
      btn.className = 'dash-enter-btn';
      btn.textContent = 'Enter →';
      btn.addEventListener('click', (e) => { e.stopPropagation(); window.App.setCurrentLocation(entity.id); });
      card.appendChild(btn);
    }

    return card;
  }

  function makeWidget(type, entities) {
    const meta = TYPE_META[type] || { label: type };
    const widget = document.createElement('section');
    widget.className = 'dash-widget';

    const h = document.createElement('h3');
    h.className = 'dash-widget-title';
    h.textContent = meta.label;
    widget.appendChild(h);

    const list = document.createElement('div');
    list.className = 'dash-entity-list';
    for (const e of entities) list.appendChild(makeEntityCard(e));
    widget.appendChild(list);

    return widget;
  }

  function makeNotesWidget(loc) {
    const widget = document.createElement('section');
    widget.className = 'dash-widget dash-widget-notes';

    const h = document.createElement('h3');
    h.className = 'dash-widget-title';
    h.textContent = 'DM Notes — ' + loc.name;
    widget.appendChild(h);

    const ta = document.createElement('textarea');
    ta.className = 'dash-notes-ta';
    ta.placeholder = 'Session notes for this location…';
    ta.value = window.App.getNote(loc.id);
    let timer;
    ta.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => window.App.setNote(loc.id, ta.value), 400);
    });
    widget.appendChild(ta);

    return widget;
  }

  // ── Location root card (campus overview grid) ───────────────────────────────

  function makeRootLocationCard(loc) {
    const card = document.createElement('div');
    card.className = 'dash-loc-card';
    card.title = 'Enter ' + loc.name;

    const name = document.createElement('div');
    name.className = 'dash-loc-card-name';
    name.textContent = loc.name;
    card.appendChild(name);

    if (loc.category) {
      const cat = document.createElement('div');
      cat.className = 'dash-loc-card-cat';
      cat.textContent = loc.category;
      card.appendChild(cat);
    }

    // Count directly related entities as a hint of how much is here
    const linkCount = (loc.related || []).length;
    if (linkCount) {
      const hint = document.createElement('div');
      hint.className = 'dash-loc-card-hint';
      hint.textContent = linkCount + ' linked';
      card.appendChild(hint);
    }

    card.addEventListener('click', () => window.App.setCurrentLocation(loc.id));
    return card;
  }

  // ── Renderers ───────────────────────────────────────────────────────────────

  function renderLocation(loc) {
    const dash = document.getElementById('dashboard');
    dash.innerHTML = '';

    // Location header
    const hdr = document.createElement('div');
    hdr.className = 'dash-location-header';

    const title = document.createElement('h2');
    title.className = 'dash-location-title';
    title.textContent = loc.name;
    hdr.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'dash-location-meta';
    const parts = [loc.type.toUpperCase()];
    if (loc.category) parts.push(loc.category);
    meta.textContent = parts.join(' · ');
    hdr.appendChild(meta);

    const detailBtn = document.createElement('button');
    detailBtn.className = 'dash-detail-btn';
    detailBtn.textContent = 'Full Entry →';
    detailBtn.addEventListener('click', () => window.openLocationModal(loc));
    hdr.appendChild(detailBtn);

    dash.appendChild(hdr);

    // Entity graph → widgets
    const graph  = getGraph(loc.id);
    const groups = groupByType(graph);

    if (!graph.length) {
      const empty = document.createElement('p');
      empty.className = 'dash-empty';
      empty.textContent = 'No linked entities yet — add related[] entries to this location to populate the dashboard.';
      dash.appendChild(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'dash-grid';
      for (const type of WIDGET_ORDER) {
        if (groups[type]?.length) grid.appendChild(makeWidget(type, groups[type]));
      }
      if (window.App.isDM()) grid.appendChild(makeNotesWidget(loc));
      dash.appendChild(grid);
    }
  }

  function renderRoot() {
    const dash = document.getElementById('dashboard');
    dash.innerHTML = '';

    // Campus header
    const hdr = document.createElement('div');
    hdr.className = 'dash-location-header dash-root-header';
    const title = document.createElement('h2');
    title.className = 'dash-location-title';
    title.textContent = 'FAIL Academy';
    hdr.appendChild(title);
    const sub = document.createElement('div');
    sub.className = 'dash-location-meta';
    sub.textContent = 'Faculty of Arms, Inquiry & Lore — Select a location to enter it';
    hdr.appendChild(sub);
    dash.appendChild(hdr);

    // Campus locations grid
    const locs = window.ENTITIES.filter((e) => e.type === 'location' && window.App.isVisible(e));
    if (locs.length) {
      const sec = document.createElement('section');
      sec.className = 'dash-root-section';
      const h = document.createElement('h3');
      h.className = 'dash-widget-title';
      h.textContent = 'Campus Locations';
      sec.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'dash-loc-grid';
      // Group by category for visual order
      const cats = {};
      for (const loc of locs) {
        const cat = loc.category || '';
        (cats[cat] = cats[cat] || []).push(loc);
      }
      for (const cat of Object.keys(cats).sort()) {
        for (const loc of cats[cat]) grid.appendChild(makeRootLocationCard(loc));
      }
      sec.appendChild(grid);
      dash.appendChild(sec);
    }

    // Party (Player Character NPCs)
    const pcs = window.ENTITIES.filter((e) => e.type === 'npc' && e.category === 'Player Character' && window.App.isVisible(e));
    if (pcs.length) {
      const sec = document.createElement('section');
      sec.className = 'dash-root-section';
      dash.appendChild(sec);
      sec.appendChild(makeWidget('npc', pcs).cloneNode ? makeWidget('npc', pcs) : makeWidget('npc', pcs));
    }

    // Active mysteries + sessions in a row
    const mysteries = window.ENTITIES.filter((e) => e.type === 'mystery' && window.App.isVisible(e));
    const sessions  = window.ENTITIES.filter((e) => e.type === 'session'  && window.App.isVisible(e));
    if (mysteries.length || sessions.length) {
      const row = document.createElement('div');
      row.className = 'dash-grid';
      if (mysteries.length) row.appendChild(makeWidget('mystery', mysteries));
      if (sessions.length)  row.appendChild(makeWidget('session',  sessions));
      dash.appendChild(row);
    }
  }

  // ── Location bar (below topbar) ─────────────────────────────────────────────

  function updateLocationBar() {
    const bar = document.getElementById('location-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const id  = window.App.getCurrentLocationId();
    const loc = id ? window.App.byId(id) : null;

    const indicator = document.createElement('span');
    indicator.className = 'loc-bar-indicator';
    indicator.textContent = loc ? '◎ ' + loc.name : '◎ Campus Root';
    bar.appendChild(indicator);

    if (loc) {
      const back = document.createElement('button');
      back.className = 'loc-bar-back';
      back.textContent = '← Campus';
      back.addEventListener('click', () => window.App.clearLocation());
      bar.appendChild(back);
    }
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  function render() {
    const id  = window.App.getCurrentLocationId();
    const loc = id ? window.App.byId(id) : null;
    if (loc && loc.type === 'location') renderLocation(loc);
    else renderRoot();
    updateLocationBar();
  }

  document.addEventListener('entities:ready',   render);
  document.addEventListener('location:changed', render);
  document.addEventListener('dm:changed',       render);
  document.addEventListener('campaign:changed', render);
})();
