// session-runner.js — adaptive DM session runner.
//
// Launched from a "▶ Run Session" header button (DM mode only).
// Three-panel view replacing the dashboard:
//   Left   (.sr-prompts):    Session-prompt beats extracted from session HTML
//   Center (.sr-detail):     Session plan (default) or entity content on pin/link click
//   Right  (.sr-sidebar):    Pinboard (seeded from session.related[]) + session notes
//
// Per-session state in localStorage key: session-runner.<id>
//   { pinnedIds: [...], notes: "..." }

(function () {

  // ── State ──────────────────────────────────────────────────────────────────

  let _session   = null;
  let _pins      = [];
  let _planHtml  = '';
  let _promptEls = [];

  // Detail panel DOM refs (set during render, cleared on exit)
  let _detailTitle, _detailBack, _detailBody, _pinsEl;

  function storageKey(id) { return 'session-runner.' + id; }

  function loadState(sessionId) {
    try { return JSON.parse(localStorage.getItem(storageKey(sessionId)) || 'null'); }
    catch { return null; }
  }

  function saveState() {
    if (!_session) return;
    const ta = document.getElementById('sr-notes');
    localStorage.setItem(storageKey(_session.id), JSON.stringify({
      pinnedIds : _pins,
      notes     : ta ? ta.value : '',
    }));
  }

  // ── Cross-link resolution (mirrors modal.js, opens in detail pane) ─────────

  function resolveCrossLinks(root) {
    const re = /\[\[([a-z0-9_]+)(?:\|([^\]]+))?\]\]/gi;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (re.test(n.nodeValue)) nodes.push(n);
      re.lastIndex = 0;
    }
    for (const node of nodes) {
      const frag = document.createDocumentFragment();
      let last = 0, m;
      const text = node.nodeValue;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        frag.appendChild(makeXLink(m[1], m[2]));
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  function makeXLink(id, label) {
    const target = window.App.byId(id);
    const text   = label || (target ? target.name : id);
    if (!target) {
      const span = document.createElement('span');
      span.className = 'xlink xlink-broken';
      span.title = `Unknown entity: ${id}`;
      span.textContent = text;
      return span;
    }
    if (!window.App.isVisible(target)) return document.createTextNode(text);
    const a = document.createElement('a');
    a.className = 'xlink sr-xlink';
    a.href = '#';
    a.setAttribute('data-id', id);
    a.textContent = text;
    return a;
  }

  function wireCrossLinks(container) {
    container.addEventListener('click', (e) => {
      const a = e.target.closest('.sr-xlink[data-id]');
      if (!a) return;
      e.preventDefault();
      showEntityInDetail(a.getAttribute('data-id'));
    });
  }

  // ── Session Chooser ────────────────────────────────────────────────────────

  function showChooser() {
    const sessions = window.ENTITIES.filter(
      (e) => e.type === 'session' && e.category === 'Planning' && window.App.isVisible(e)
    );

    const overlay = document.createElement('div');
    overlay.id = 'sr-chooser-overlay';

    const box = mkEl('div', 'sr-chooser');
    const hdr = mkEl('div', 'sr-chooser-hdr');
    hdr.appendChild(mkEl('span', 'sr-chooser-title', 'Launch Session Runner'));
    const closeBtn = mkEl('button', 'sr-chooser-close', '×');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    hdr.appendChild(closeBtn);
    box.appendChild(hdr);

    const list = mkEl('div', 'sr-chooser-list');
    if (!sessions.length) {
      list.appendChild(mkEl('p', 'sr-chooser-empty', 'No sessions with category "Planning" found.'));
    } else {
      sessions.forEach((s) => {
        const item = mkEl('button', 'sr-chooser-item');
        item.type = 'button';
        item.appendChild(mkEl('span', 'sr-chooser-item-name', s.name));
        if (s.startLocation) {
          const locName = window.App.byId(s.startLocation)?.name || s.startLocation;
          item.appendChild(mkEl('span', 'sr-chooser-item-meta', `Starts at: ${locName}`));
        }
        item.addEventListener('click', () => { overlay.remove(); launchRunner(s); });
        list.appendChild(item);
      });
    }

    box.appendChild(list);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  // ── Launch ─────────────────────────────────────────────────────────────────

  async function launchRunner(session) {
    _session   = session;
    _planHtml  = '';
    _promptEls = [];

    const saved = loadState(session.id);
    _pins = (saved && saved.pinnedIds && saved.pinnedIds.length)
      ? [...saved.pinnedIds]
      : [...(session.related || [])];

    try {
      const base = window.CAMPAIGN_BASE ? window.CAMPAIGN_BASE + '/' : '';
      const r = await fetch(base + session.contentFile);
      if (r.ok) {
        const html = await r.text();
        const doc  = new DOMParser().parseFromString(html, 'text/html');
        _promptEls = [...doc.querySelectorAll('.session-prompt')];
        _promptEls.forEach((el) => el.remove());
        _planHtml = doc.querySelector('article')?.innerHTML || html;
      }
    } catch { /* no content — handled gracefully */ }

    renderRunner(saved?.notes || '');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function renderRunner(savedNotes) {
    document.getElementById('location-bar').hidden = true;
    document.getElementById('dashboard').hidden    = true;

    const mount = document.getElementById('session-runner');
    mount.innerHTML = '';
    mount.hidden    = false;

    // Sub-topbar
    const bar     = mkEl('div', 'sr-bar');
    const barLeft = mkEl('div', 'sr-bar-left');
    barLeft.appendChild(mkEl('span', 'sr-session-name', _session.name));
    if (_session.startLocation) {
      const locName = window.App.byId(_session.startLocation)?.name || _session.startLocation;
      barLeft.appendChild(mkEl('span', 'sr-start-loc', `▸ ${locName}`));
    }
    bar.appendChild(barLeft);
    const exitBtn = mkEl('button', 'sr-exit-btn', '✕ Exit Runner');
    exitBtn.type = 'button';
    exitBtn.addEventListener('click', exitRunner);
    bar.appendChild(exitBtn);
    mount.appendChild(bar);

    // Three panels
    const body = mkEl('div', 'sr-body');
    body.appendChild(buildPromptsPanel());
    body.appendChild(buildDetailPanel());
    body.appendChild(buildSidebarPanel(savedNotes));
    mount.appendChild(body);
  }

  // ── Prompts panel ──────────────────────────────────────────────────────────

  function buildPromptsPanel() {
    const panel = mkEl('div', 'sr-panel sr-prompts');
    panel.appendChild(mkEl('div', 'sr-panel-hdr', 'Prompts'));
    const body = mkEl('div', 'sr-panel-body');

    if (!_promptEls.length) {
      body.appendChild(mkEl('p', 'sr-empty', 'No session prompts found.'));
    } else {
      _promptEls.forEach((src) => {
        const card    = mkEl('div', 'sr-prompt-card');
        const labelEl = src.querySelector('.prompt-label');
        if (labelEl) {
          card.appendChild(mkEl('div', 'sr-prompt-label', labelEl.textContent));
          labelEl.remove();
        }
        const content = mkEl('div', 'sr-prompt-content');
        content.innerHTML = src.innerHTML;
        resolveCrossLinks(content);
        wireCrossLinks(content);
        card.appendChild(content);
        body.appendChild(card);
      });
    }

    panel.appendChild(body);
    return panel;
  }

  // ── Detail panel ──────────────────────────────────────────────────────────

  function buildDetailPanel() {
    const panel = mkEl('div', 'sr-panel sr-detail');

    const hdr = mkEl('div', 'sr-panel-hdr');
    _detailTitle = mkEl('span', 'sr-detail-title', _session.name);
    _detailBack  = mkEl('button', 'sr-detail-back', '← Plan');
    _detailBack.type = 'button';
    _detailBack.hidden = true;
    _detailBack.addEventListener('click', () => showPlanInDetail());
    hdr.appendChild(_detailTitle);
    hdr.appendChild(_detailBack);
    panel.appendChild(hdr);

    _detailBody = mkEl('div', 'sr-detail-body');
    panel.appendChild(_detailBody);

    showPlanInDetail();
    return panel;
  }

  function showPlanInDetail() {
    _detailTitle.textContent = _session.name;
    _detailBack.hidden = true;
    _detailBody.innerHTML = _planHtml || '<p class="sr-empty">No plan content loaded.</p>';
    resolveCrossLinks(_detailBody);
    wireCrossLinks(_detailBody);
    _detailBody.scrollTop = 0;
  }

  function showEntityInDetail(entityId) {
    const entity = window.App.byId(entityId);
    if (!entity) return;
    _detailTitle.textContent = entity.name;
    _detailBack.hidden = false;
    _detailBody.innerHTML = '<p class="sr-loading">Loading…</p>';
    _detailBody.scrollTop = 0;

    const base = window.CAMPAIGN_BASE ? window.CAMPAIGN_BASE + '/' : '';
    fetch(base + entity.contentFile)
      .then((r) => r.ok ? r.text() : '<p class="sr-empty">Content file not found.</p>')
      .then((html) => {
        _detailBody.innerHTML = html;
        resolveCrossLinks(_detailBody);
        wireCrossLinks(_detailBody);
      })
      .catch(() => { _detailBody.innerHTML = '<p class="sr-empty">Failed to load content.</p>'; });
  }

  // ── Sidebar: pinboard + notes ──────────────────────────────────────────────

  function buildSidebarPanel(savedNotes) {
    const panel = mkEl('div', 'sr-panel sr-sidebar');

    // Pinboard header + Add button
    const pinHdr = mkEl('div', 'sr-panel-hdr');
    pinHdr.appendChild(mkEl('span', '', 'Pinboard'));
    const addBtn = mkEl('button', 'sr-add-pin', '＋ Add');
    addBtn.type = 'button';
    pinHdr.appendChild(addBtn);
    panel.appendChild(pinHdr);

    // Collapsible search field
    const searchWrap   = mkEl('div', 'sr-pin-search');
    searchWrap.hidden  = true;
    const searchInput  = document.createElement('input');
    searchInput.type   = 'search';
    searchInput.className = 'sr-pin-search-input';
    searchInput.placeholder = 'Search entities…';
    const searchResults = mkEl('ul', 'sr-pin-results');
    searchResults.hidden = true;
    searchWrap.appendChild(searchInput);
    searchWrap.appendChild(searchResults);
    panel.appendChild(searchWrap);

    addBtn.addEventListener('click', () => {
      searchWrap.hidden = !searchWrap.hidden;
      if (!searchWrap.hidden) { searchInput.value = ''; searchResults.hidden = true; searchInput.focus(); }
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      searchResults.innerHTML = '';
      searchResults.hidden = !q;
      if (!q) return;

      const hits = window.ENTITIES
        .filter((e) => window.App.isVisible(e) && e.name.toLowerCase().includes(q) && !_pins.includes(e.id))
        .slice(0, 8);

      hits.forEach((e) => {
        const li  = document.createElement('li');
        const btn = mkEl('button', 'sr-pin-result', e.name);
        btn.type  = 'button';
        btn.addEventListener('click', () => {
          _pins.push(e.id);
          saveState();
          renderPins();
          searchWrap.hidden = true;
          searchInput.value = '';
          searchResults.hidden = true;
        });
        li.appendChild(btn);
        searchResults.appendChild(li);
      });
      if (!hits.length) {
        const li = document.createElement('li');
        li.className   = 'sr-pin-result-empty';
        li.textContent = 'No matches';
        searchResults.appendChild(li);
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { searchWrap.hidden = true; addBtn.focus(); }
    });

    // Pins list
    _pinsEl = mkEl('div', 'sr-pins');
    panel.appendChild(_pinsEl);
    renderPins();

    // Notes
    panel.appendChild(mkEl('div', 'sr-panel-hdr', 'Session Notes'));
    const ta = mkEl('textarea', 'sr-notes-ta');
    ta.id = 'sr-notes';
    ta.placeholder = 'Notes for this session…';
    ta.value = savedNotes;
    let noteTimer;
    ta.addEventListener('input', () => { clearTimeout(noteTimer); noteTimer = setTimeout(saveState, 400); });
    panel.appendChild(ta);

    return panel;
  }

  function renderPins() {
    if (!_pinsEl) return;
    _pinsEl.innerHTML = '';

    _pins.forEach((id) => {
      const entity = window.App.byId(id);
      if (!entity) return;

      const card = mkEl('div', 'sr-pin-card');
      if (entity.visibility === 'dm-only') card.classList.add('sr-pin-dm');

      const nameBtn = mkEl('button', 'sr-pin-name', entity.name);
      nameBtn.type  = 'button';
      nameBtn.addEventListener('click', () => showEntityInDetail(id));
      card.appendChild(nameBtn);

      const meta = mkEl('div', 'sr-pin-meta');
      meta.appendChild(mkEl('span', 'sr-pin-type', entity.type));
      if (entity.category) meta.appendChild(mkEl('span', 'sr-pin-cat', entity.category));
      card.appendChild(meta);

      const rm = mkEl('button', 'sr-pin-rm', '×');
      rm.type  = 'button';
      rm.title = 'Remove pin';
      rm.addEventListener('click', (e) => {
        e.stopPropagation();
        _pins = _pins.filter((x) => x !== id);
        saveState();
        renderPins();
      });
      card.appendChild(rm);

      _pinsEl.appendChild(card);
    });

    if (!_pins.length) {
      _pinsEl.appendChild(mkEl('p', 'sr-empty', 'No pins. Use ＋ Add to pin an entity.'));
    }
  }

  // ── Exit ───────────────────────────────────────────────────────────────────

  function exitRunner() {
    saveState();
    _session = null; _pins = []; _planHtml = ''; _promptEls = [];
    _detailTitle = _detailBack = _detailBody = _pinsEl = null;

    document.getElementById('session-runner').hidden = true;
    document.getElementById('location-bar').hidden   = false;
    document.getElementById('dashboard').hidden       = false;
  }

  // ── Helper ─────────────────────────────────────────────────────────────────

  function mkEl(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls)  n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function wire() {
    const btn = document.getElementById('run-session-btn');
    if (!btn) return;
    function syncBtn() { btn.hidden = !window.App.isDM(); }
    document.addEventListener('dm:changed', syncBtn);
    syncBtn();
    btn.addEventListener('click', showChooser);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

})();
