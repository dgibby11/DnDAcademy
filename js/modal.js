// modal.js — the content modal.
//
// Exposes window.openLocationModal(entity). Renders the entity's content by
// contentType (html / image / pdf), then appends two generated sections:
//   • Related     — internal cross-links from entity.related[]
//   • References  — external links from entity.links[]
//
// In DM mode a footer is shown with:
//   • Revealed to Players toggle (persisted via state.js / localStorage)
//   • DM Notes textarea (auto-saved, DM-private)

(function () {
  let overlay, titleEl, linksEl, bodyEl, revealBtn, notesArea, noteTimer;
  let lastFocus, currentEntity;

  function build() {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header id="modal-header">
          <h2 id="modal-title"></h2>
          <button id="modal-close" type="button" aria-label="Close">&times;</button>
        </header>
        <div id="modal-links" hidden></div>
        <div id="modal-body"></div>
        <footer id="modal-dm-footer">
          <div class="dm-footer-row">
            <button id="modal-reveal-btn" type="button" class="reveal-btn"></button>
          </div>
          <div class="dm-footer-notes">
            <label class="dm-footer-label" for="modal-notes-area">DM Notes</label>
            <textarea id="modal-notes-area" placeholder="Scratch notes (auto-saved)…"></textarea>
          </div>
        </footer>
      </div>`;
    document.body.appendChild(overlay);

    titleEl   = overlay.querySelector('#modal-title');
    linksEl   = overlay.querySelector('#modal-links');
    bodyEl    = overlay.querySelector('#modal-body');
    revealBtn = overlay.querySelector('#modal-reveal-btn');
    notesArea = overlay.querySelector('#modal-notes-area');

    overlay.querySelector('#modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });

    // Cross-link delegation (body content + Related links).
    bodyEl.addEventListener('click', (e) => {
      const a = e.target.closest('.xlink[data-id]');
      if (!a) return;
      e.preventDefault();
      const target = window.App.byId(a.getAttribute('data-id'));
      if (target) open(target);
    });

    // Reveal toggle.
    revealBtn.addEventListener('click', () => {
      if (!currentEntity) return;
      window.App.setRevealed(currentEntity.id, !window.App.isRevealed(currentEntity.id));
      syncRevealBtn(currentEntity.id);
    });

    // Notes — debounced auto-save.
    notesArea.addEventListener('input', () => {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        if (currentEntity) window.App.setNote(currentEntity.id, notesArea.value);
      }, 400);
    });
  }

  function syncRevealBtn(id) {
    const revealed = window.App.isRevealed(id);
    revealBtn.textContent  = revealed ? '◉ Revealed to players' : '◯ Hidden from players';
    revealBtn.classList.toggle('reveal-btn-on', revealed);
  }

  function updateLinksBar(loc) {
    const links = loc.links || [];
    if (!links.length) { linksEl.hidden = true; linksEl.innerHTML = ''; return; }
    linksEl.innerHTML = '';
    for (const ln of links) {
      const a = document.createElement('a');
      a.href = ln.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'modal-ext-btn';
      a.textContent = ln.label || ln.url;
      linksEl.appendChild(a);
    }
    linksEl.hidden = false;
  }

  function updateDmFooter(entity) {
    syncRevealBtn(entity.id);
    notesArea.value = window.App.getNote(entity.id);
  }

  // Replace [[id]] / [[id|text]] tokens inside text nodes with link elements.
  function resolveCrossLinks(root) {
    const re = /\[\[([a-z0-9_]+)(?:\|([^\]]+))?\]\]/gi;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const targets = [];
    let n;
    while ((n = walker.nextNode())) {
      if (re.test(n.nodeValue)) targets.push(n);
      re.lastIndex = 0;
    }
    for (const node of targets) {
      const frag = document.createDocumentFragment();
      let last = 0;
      const text = node.nodeValue;
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        frag.appendChild(makeLink(m[1], m[2]));
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  function makeLink(id, label) {
    const target = window.App.byId(id);
    const text = label || (target ? target.name : id);
    if (!target) {
      const span = document.createElement('span');
      span.className = 'xlink xlink-broken';
      span.title = `Unknown entity: ${id}`;
      span.textContent = text;
      return span;
    }
    if (!window.App.isVisible(target)) {
      return document.createTextNode(text);
    }
    const a = document.createElement('a');
    a.className = 'xlink';
    a.href = '#';
    a.setAttribute('data-id', id);
    a.textContent = text;
    return a;
  }

  function relatedLink(target) {
    const a = document.createElement('a');
    a.className = 'xlink';
    a.href = '#';
    a.setAttribute('data-id', target.id);
    a.textContent = target.name;
    if (target.visibility === 'dm-only') a.classList.add('xlink-dm');
    return a;
  }

  function appendExtras(loc) {
    const related = (loc.related || [])
      .map((id) => window.App.byId(id))
      .filter((e) => e && window.App.isVisible(e));
    if (related.length) {
      const sec = document.createElement('section');
      sec.className = 'modal-related';
      const h = document.createElement('h3');
      h.textContent = 'Related';
      sec.appendChild(h);
      const ul = document.createElement('ul');
      for (const t of related) {
        const li = document.createElement('li');
        li.appendChild(relatedLink(t));
        ul.appendChild(li);
      }
      sec.appendChild(ul);
      bodyEl.appendChild(sec);
    }

    // Session completion button (DM mode only)
    if (loc.type === 'session' && window.App.isDM() && Array.isArray(loc.reveals) && loc.reveals.length) {
      const completedKey = loc.id + ':complete';
      const done = window.App.isRevealed(completedKey);
      const sec = document.createElement('section');
      sec.className = 'modal-session-complete';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'session-complete-btn' + (done ? ' session-complete-btn-done' : '');
      btn.disabled = done;
      btn.textContent = done
        ? 'Session complete — players updated'
        : `Complete session → choose what players discover`;
      if (!done) {
        btn.addEventListener('click', () => openSessionConfirm(loc, () => {
          btn.textContent = 'Session complete — players updated';
          btn.disabled    = true;
          btn.classList.add('session-complete-btn-done');
        }));
      }
      sec.appendChild(btn);
      bodyEl.appendChild(sec);
    }
  }

  function open(loc) {
    if (!overlay) build();
    if (!loc) return;

    currentEntity = loc;
    lastFocus = document.activeElement;
    titleEl.textContent = loc.name;
    bodyEl.innerHTML = '<p class="modal-status">Loading…</p>';
    bodyEl.scrollTop = 0;
    overlay.hidden = false;
    overlay.querySelector('#modal-close').focus();

    updateDmFooter(loc);
    updateLinksBar(loc);

    const type = loc.contentType;
    const base = window.CAMPAIGN_BASE ? window.CAMPAIGN_BASE + '/' : '';
    const file = loc.contentFile ? base + loc.contentFile : '';

    if (type === 'image') {
      bodyEl.innerHTML = `
        <div class="modal-image"><img src="${file}" alt="${loc.name}" /></div>
        <p class="modal-image-hint">Scroll to zoom · drag to pan · double-click to reset ·
          <button class="modal-image-fs" type="button">⊞ Fullscreen</button></p>`;
      const mCont = bodyEl.querySelector('.modal-image');
      const mImg  = mCont.querySelector('img');
      wireZoom(mCont, mImg);
      bodyEl.querySelector('.modal-image-fs').addEventListener('click', () => openImageModal(file, loc.name));
      appendExtras(loc);
    } else if (type === 'pdf') {
      bodyEl.innerHTML = `
        <div class="modal-pdf">
          <iframe src="${file}" title="${loc.name}"></iframe>
          <p class="modal-fallback">
            Can't see the document?
            <a href="${file}" target="_blank" rel="noopener">Open the PDF in a new tab</a>.
          </p>
        </div>`;
      appendExtras(loc);
    } else if (type === 'inline') {
      bodyEl.innerHTML = loc.content || '<p class="modal-status">No content.</p>';
      resolveCrossLinks(bodyEl);
      appendExtras(loc);
    } else {
      fetch(file)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((html) => {
          bodyEl.innerHTML = html;
          resolveCrossLinks(bodyEl);
          appendExtras(loc);
        })
        .catch((err) => {
          bodyEl.innerHTML = `<p class="modal-status modal-error">Could not load content for "${loc.name}".<br><small>${err}</small></p>`;
          console.error('[modal] content load failed:', file, err);
        });
    }
  }

  // ── Zoom / pan helper ─────────────────────────────────────────────────────────

  function wireZoom(container, img) {
    let scale = 1, ox = 0, oy = 0, dragging = false, sx = 0, sy = 0;
    const MIN = 0.25, MAX = 8;

    function clamp(s, x, y) {
      if (s <= 1) return { x: 0, y: 0 };
      const mw = container.clientWidth  * (s - 1) / 2;
      const mh = container.clientHeight * (s - 1) / 2;
      return { x: Math.max(-mw, Math.min(mw, x)), y: Math.max(-mh, Math.min(mh, y)) };
    }

    function apply() {
      img.style.transform = `translate(${ox}px,${oy}px) scale(${scale})`;
      img.style.cursor = dragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in';
    }

    function zoomBy(factor) {
      scale = Math.max(MIN, Math.min(MAX, scale * factor));
      const c = clamp(scale, ox, oy);
      ox = c.x; oy = c.y;
      apply();
    }

    function reset() { scale = 1; ox = 0; oy = 0; apply(); }

    function onMove(e) {
      if (!dragging) return;
      const c = clamp(scale, e.clientX - sx, e.clientY - sy);
      ox = c.x; oy = c.y;
      apply();
    }

    function onUp() {
      dragging = false;
      apply();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }

    img.draggable = false;
    img.style.transformOrigin = 'center';

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });

    container.addEventListener('mousedown', (e) => {
      if (scale <= 1 || e.button !== 0) return;
      dragging = true;
      sx = e.clientX - ox;
      sy = e.clientY - oy;
      apply();
      e.preventDefault();
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });

    container.addEventListener('dblclick', reset);

    apply();
    return { reset, zoomBy };
  }

  // ── Standalone image modal (openImageModal) ────────────────────────────────

  let imgOverlay, imgTitleEl, imgEl, imgZoomCtrl;

  function buildImageModal() {
    imgOverlay = document.createElement('div');
    imgOverlay.id = 'img-overlay';
    imgOverlay.hidden = true;
    imgOverlay.innerHTML = `
      <div id="img-modal">
        <div id="img-modal-bar">
          <span id="img-modal-title"></span>
          <div class="img-zoom-controls">
            <button class="img-zoom-btn" id="img-btn-out"   type="button">−</button>
            <button class="img-zoom-btn" id="img-btn-reset" type="button">⊙ Fit</button>
            <button class="img-zoom-btn" id="img-btn-in"    type="button">+</button>
          </div>
          <button id="img-modal-close" type="button">✕</button>
        </div>
        <div id="img-modal-stage">
          <img id="img-modal-img" src="" alt="" />
        </div>
      </div>`;
    document.body.appendChild(imgOverlay);

    imgTitleEl = imgOverlay.querySelector('#img-modal-title');
    imgEl      = imgOverlay.querySelector('#img-modal-img');
    const stage = imgOverlay.querySelector('#img-modal-stage');

    imgZoomCtrl = wireZoom(stage, imgEl);

    imgOverlay.querySelector('#img-btn-out').addEventListener('click',   () => imgZoomCtrl.zoomBy(1 / 1.4));
    imgOverlay.querySelector('#img-btn-reset').addEventListener('click', () => imgZoomCtrl.reset());
    imgOverlay.querySelector('#img-btn-in').addEventListener('click',    () => imgZoomCtrl.zoomBy(1.4));
    imgOverlay.querySelector('#img-modal-close').addEventListener('click', closeImageModal);
    imgOverlay.addEventListener('click', (e) => { if (e.target === imgOverlay) closeImageModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !imgOverlay.hidden) closeImageModal(); });
  }

  function openImageModal(src, title) {
    if (!imgOverlay) buildImageModal();
    imgTitleEl.textContent = title || '';
    imgEl.src = src;
    imgEl.alt = title || '';
    imgZoomCtrl.reset();
    imgOverlay.hidden = false;
  }

  function closeImageModal() {
    imgOverlay.hidden = true;
    imgEl.src = '';
    imgZoomCtrl.reset();
  }

  // ── Session confirm dialog ─────────────────────────────────────────────────────
  const TYPE_LABELS = {
    location: 'Locations', npc: 'NPCs', faction: 'Factions',
    mystery: 'Mysteries', item: 'Items', creature: 'Creatures',
  };
  // Preferred display order for type groups
  const TYPE_ORDER = ['location', 'npc', 'faction', 'mystery', 'item', 'creature'];

  let confirmEl = null;

  function buildConfirm() {
    confirmEl = document.createElement('div');
    confirmEl.id = 'session-confirm-overlay';
    confirmEl.hidden = true;
    confirmEl.innerHTML = `
      <div id="session-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="session-confirm-title">
        <header id="session-confirm-header">
          <h2 id="session-confirm-title"></h2>
          <button id="session-confirm-close" type="button" aria-label="Close">&times;</button>
        </header>
        <p id="session-confirm-desc"></p>
        <div id="session-confirm-groups"></div>
        <footer id="session-confirm-footer">
          <button id="session-confirm-cancel" type="button">Cancel</button>
          <button id="session-confirm-ok" type="button">Confirm</button>
        </footer>
      </div>`;
    document.body.appendChild(confirmEl);

    const dismiss = () => { confirmEl.hidden = true; };
    confirmEl.querySelector('#session-confirm-close').addEventListener('click', dismiss);
    confirmEl.querySelector('#session-confirm-cancel').addEventListener('click', dismiss);
    confirmEl.addEventListener('click', (e) => { if (e.target === confirmEl) dismiss(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !confirmEl.hidden) { e.stopPropagation(); dismiss(); }
    });
  }

  function openSessionConfirm(session, onConfirmed) {
    if (!confirmEl) buildConfirm();

    const completedKey = session.id + ':complete';
    const titleEl   = confirmEl.querySelector('#session-confirm-title');
    const descEl    = confirmEl.querySelector('#session-confirm-desc');
    const groupsEl  = confirmEl.querySelector('#session-confirm-groups');

    titleEl.textContent = 'Complete: ' + session.name;
    descEl.textContent  =
      'Checked entities will become visible in Player View when you click Confirm. ' +
      'Uncheck anything players haven\'t discovered yet — you can reveal those later ' +
      'by opening this session again.';

    // Group reveals by entity type
    const groups = {};
    for (const id of session.reveals || []) {
      const entity = window.App.byId(id);
      if (!entity) continue;
      const t = entity.type || 'other';
      (groups[t] = groups[t] || []).push(entity);
    }

    // Render groups in preferred type order, then any remaining types alphabetically
    groupsEl.innerHTML = '';
    const orderedTypes = [
      ...TYPE_ORDER.filter((t) => groups[t]),
      ...Object.keys(groups).filter((t) => !TYPE_ORDER.includes(t)).sort(),
    ];

    for (const type of orderedTypes) {
      const entities = groups[type];
      const sec  = document.createElement('section');
      sec.className = 'scg-group';
      const h3 = document.createElement('h3');
      h3.textContent = TYPE_LABELS[type] || (type.charAt(0).toUpperCase() + type.slice(1) + 's');
      sec.appendChild(h3);
      const ul = document.createElement('ul');
      for (const entity of entities) {
        const alreadyRevealed = window.App.isRevealed(entity.id);
        const li    = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'scg-label' + (alreadyRevealed ? ' scg-already' : '');
        const cb = document.createElement('input');
        cb.type      = 'checkbox';
        cb.checked   = true;
        cb.dataset.id = entity.id;
        cb.disabled  = alreadyRevealed;
        label.appendChild(cb);
        const nameSpan = document.createElement('span');
        nameSpan.textContent = entity.name;
        label.appendChild(nameSpan);
        if (alreadyRevealed) {
          const note = document.createElement('span');
          note.className   = 'scg-already-note';
          note.textContent = 'already visible';
          label.appendChild(note);
        }
        li.appendChild(label);
        ul.appendChild(li);
      }
      sec.appendChild(ul);
      groupsEl.appendChild(sec);
    }

    // Replace ok button to clear any prior handler
    const oldOk  = confirmEl.querySelector('#session-confirm-ok');
    const newOk  = oldOk.cloneNode(true);
    oldOk.replaceWith(newOk);
    newOk.addEventListener('click', () => {
      const checked = groupsEl.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)');
      for (const cb of checked) window.App.setRevealed(cb.dataset.id, true);
      window.App.setRevealed(completedKey, true);
      confirmEl.hidden = true;
      if (typeof onConfirmed === 'function') onConfirmed();
    });

    confirmEl.hidden = false;
    newOk.focus();
  }

  function close() {
    if (!overlay) return;
    clearTimeout(noteTimer);
    // Flush any pending note before closing.
    if (currentEntity && notesArea) {
      window.App.setNote(currentEntity.id, notesArea.value);
    }
    overlay.hidden = true;
    bodyEl.innerHTML = '';
    currentEntity = null;
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  window.openLocationModal  = open;
  window.openSessionConfirm = openSessionConfirm;
  window.openImageModal     = openImageModal;

  // Test hook — exposes internals for tools/tests.html.
  window._modalTest = { resolveCrossLinks, makeLink, wireZoom };
})();
