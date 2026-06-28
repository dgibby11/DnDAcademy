(function () {
  const MAX_RESULTS = 15;
  let input, results, activeIndex = -1, matches = [];

  // Score an entity against a query. Returns 0 if no match.
  // Higher score = better match; results are sorted descending.
  function score(e, q) {
    const words = q.split(/\s+/).filter(Boolean);
    const n     = e.name.toLowerCase();
    const fields = [
      n,
      e.type.toLowerCase(),
      (e.category || '').toLowerCase(),
      ...(e.tags || []).map(t => t.toLowerCase()),
    ];

    // All query words must appear somewhere across name/type/category/tags.
    if (!words.every(w => fields.some(f => f.includes(w)))) return 0;

    if (n === q)                              return 5; // exact name
    if (n.startsWith(q))                      return 4; // name prefix
    if (n.includes(q))                        return 3; // name substring
    if (words.every(w => n.includes(w)))      return 2; // all words in name
    return 1;                                           // match in other fields
  }

  function buildMatches(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return window.ENTITIES
      .filter(e => window.App.isVisible(e))
      .map(e => ({ e, s: score(e, q) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ e }) => e)
      .slice(0, MAX_RESULTS);
  }

  const TYPE_LABELS = {
    reference: 'Ref', location: 'Loc', npc: 'NPC', faction: 'Faction',
    item: 'Item', creature: 'Creature', mystery: 'Mystery', session: 'Session',
    image: 'Map',
  };

  function renderResults() {
    results.innerHTML = '';
    activeIndex = -1;
    if (!matches.length) { results.hidden = true; return; }

    for (let i = 0; i < matches.length; i++) {
      const e = matches[i];
      const li = document.createElement('li');
      li.className = 'sr-item';
      if (e.visibility === 'dm-only') li.classList.add('sr-item-dm');
      li.setAttribute('role', 'option');
      li.dataset.index = i;

      const label = TYPE_LABELS[e.type] || e.type;
      li.innerHTML =
        `<span class="sr-name">${e.name}</span>` +
        `<span class="sr-badge">${label}</span>`;

      li.addEventListener('mousedown', ev => {
        ev.preventDefault();
        selectResult(i);
      });
      results.appendChild(li);
    }
    results.hidden = false;
  }

  function setActive(i) {
    const items = results.querySelectorAll('.sr-item');
    items.forEach((el, idx) => el.classList.toggle('sr-active', idx === i));
    activeIndex = i;
    if (i >= 0 && items[i]) items[i].scrollIntoView({ block: 'nearest' });
  }

  function selectResult(i) {
    const e = matches[i >= 0 ? i : 0];
    if (!e) return;
    window.openLocationModal(e);
    clearSearch();
  }

  function clearSearch() {
    input.value = '';
    matches = [];
    activeIndex = -1;
    results.hidden = true;
    input.blur();
  }

  function wire() {
    input = document.getElementById('search-input');
    results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', () => {
      matches = buildMatches(input.value);
      renderResults();
    });

    input.addEventListener('keydown', e => {
      const len = matches.length;
      if (e.key === 'Escape') { e.preventDefault(); clearSearch(); return; }
      if (!len) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((activeIndex + 1) % len);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((activeIndex - 1 + len) % len);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectResult(activeIndex);
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => { results.hidden = true; }, 160);
    });
    input.addEventListener('focus', () => {
      if (matches.length) results.hidden = false;
    });

    // Press / to focus search (when not already in a text field)
    document.addEventListener('keydown', e => {
      if (e.key === '/' &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });

    function refilter() {
      if (input.value.trim()) {
        matches = buildMatches(input.value);
        renderResults();
      }
    }
    document.addEventListener('dm:changed', refilter);
    document.addEventListener('campaign:changed', refilter);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
