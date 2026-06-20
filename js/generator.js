// generator.js — Random NPC and Item generator for the DM.
//
// Generated entities live in localStorage (key: fucks.generated.v1) and are
// injected into window.ENTITIES before menu.js renders, so they appear in the
// Index, open in modals, and participate in [[cross-links]] like any entity.
// window.App.byId is patched to include generated entities.
//
// UI: #generator-btn in topbar opens the generator panel.

(function () {
  const GEN_KEY = 'fucks.generated.v1';

  // ── Storage ─────────────────────────────────────────────────────────────────

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(GEN_KEY)) || []; }
    catch { return []; }
  }
  function persistAll() {
    try { localStorage.setItem(GEN_KEY, JSON.stringify(_genList)); }
    catch (e) { console.warn('[generator] save failed:', e); }
  }

  let _genList = loadAll();
  let _genById = new Map(_genList.map((e) => [e.id, e]));

  // Patch App.byId so cross-links and related lookups work for generated entities.
  // Must run before any rendering (this IIFE runs at script parse time).
  const _origById = window.App.byId.bind(window.App);
  window.App.byId = (id) => _origById(id) || _genById.get(id);

  // Inject saved entities into window.ENTITIES before menu.js's entities:ready handler.
  // Script order: generator.js loads before menu.js, so this listener runs first.
  document.addEventListener('entities:ready', () => {
    for (const e of _genList) {
      if (!window.ENTITIES.find((x) => x.id === e.id)) window.ENTITIES.push(e);
    }
  }, { once: true });

  // ── Random tables ────────────────────────────────────────────────────────────

  const T = {
    first: ['Aldric','Brek','Caela','Daven','Elara','Fenn','Garis','Hael','Iris','Jael',
            'Kira','Lorn','Mira','Noel','Orin','Pell','Quinn','Ren','Sable','Tal',
            'Una','Vex','Wren','Xan','Yael','Zara','Barak','Celeste','Dorin','Elwyn',
            'Faela','Grim','Heska','Iver','Juniper','Kylen','Loris','Marsh','Nira','Oryn',
            'Pira','Quell','Reva','Sorn','Tave','Ulric','Vayne','Wess','Yorin','Zeal'],

    last:  ['Ashford','Blackmere','Coldwell','Duskmore','Evenwood','Frost','Greymantle',
            'Holt','Ironvale','Kell','Lorne','Mosswick','Nighthollow','Ordain','Pale',
            'Quickthorn','Riversong','Stone','Thorn','Umbra','Vale','Whittock','Yarrow','Zale',
            'Briarcroft','Dunmore','Feldwick','Galvane','Harwick','Inkwell'],

    races: [
      {v:'Human',w:22},{v:'High Elf',w:10},{v:'Wood Elf',w:8},{v:'Drow',w:3},
      {v:'Hill Dwarf',w:8},{v:'Mountain Dwarf',w:5},{v:'Lightfoot Halfling',w:7},
      {v:'Half-Elf',w:10},{v:'Rock Gnome',w:5},{v:'Forest Gnome',w:3},
      {v:'Tiefling',w:6},{v:'Half-Orc',w:5},{v:'Dragonborn',w:4},
      {v:'Aasimar',w:3},{v:'Tabaxi',w:2},{v:'Kenku',w:1},{v:'Goblin',w:1},
    ],

    roles: [
      '1st-Year Student','2nd-Year Student','3rd-Year Student','4th-Year Student (Senior)',
      'Faculty — Combat Studies','Faculty — Applied Magic','Faculty — Intelligence & Recon',
      'Faculty — Field Medicine','Staff — Administration','Staff — Facilities',
      'Contractor (Thornwick Consortium)','Visiting Scholar','Alumni','External Agent',
    ],

    traits: [
      'Speaks almost exclusively in tactical observations.',
      'Writes everything down the moment it happens.',
      'Greets everyone as if they still owe money from last semester.',
      'Cannot resist critiquing the combat form of anyone nearby.',
      'Nervously laughs at deeply inappropriate moments.',
      'Wears armor to every social event. Just in case.',
      'Talks to their weapons by name.',
      'Obsessively formal — titles for everyone, every time.',
      'Perpetually working on a thesis nobody asked for.',
      'Keeps a ledger of every sparring win and loss.',
      'Quotes obscure historical battles to make a point about anything.',
      'Refuses to use the same door twice in a day.',
      'Somehow always has exactly the right tool. Never explains why.',
      'Deeply suspicious of anyone who hasn\'t been mildly injured at least once.',
      'Believes they are secretly somewhat famous.',
      'Never sits with their back to a doorway.',
      'Has a strong opinion about everyone\'s footwear.',
      'Memorises campus schedules and knows exactly where everyone should be.',
    ],

    bonds: [
      'Has a younger sibling back home they send money to every month.',
      'Trying to graduate before a bitter rival does.',
      'Owes a debt to someone on campus — and won\'t say who.',
      'Had a mentor who disappeared two years ago.',
      'Deeply loyal to their faction, to a fault.',
      'Wants nothing more than to impress [[headmistress_dowe|Headmistress Dowe]].',
      'Running from something. Refuses to elaborate.',
      'Desperately wants a place in the [[expedition_club|Expedition Club]].',
      'Has a complicated, unresolved history with the [[thornwick_consortium|Thornwick Consortium]].',
      'Once found something in the old wing of the library. Has told no one.',
      'Is trying to prove something to a parent who said they\'d never survive here.',
    ],

    flaws: [
      'Cannot resist showing off in front of an audience.',
      'Pathologically bad at keeping secrets.',
      'Freezes completely around real authority figures.',
      'Has a Three-Dragon Ante problem.',
      'Consistently overestimates their own abilities.',
      'Cannot say no to a dare.',
      'Holds grudges for an unreasonable length of time.',
      'Terrible at asking for help until it\'s far too late.',
      'Makes major decisions entirely on impulse.',
      'Convinced they are one good idea away from solving everything.',
    ],

    builds:   ['slender','stocky','lanky','compact','broad-shouldered','slight','wiry','heavyset'],

    features: [
      'a pale scar running from jaw to ear',
      'mismatched eyes — one brown, one pale grey',
      'elaborate runic tattoos on both forearms',
      'impractically styled hair that somehow never moves',
      'remarkably good posture at all times',
      'rarely blinks — just watches',
      'perpetual ink stains on both hands',
      'an Academy ring worn on the wrong finger',
      'a nervous habit of adjusting the same buckle over and over',
      'always holding something — a coin, a quill, a small smooth stone',
    ],

    hooks: [
      'Needs someone to retrieve something from a restricted campus area.',
      'Witnessed something they haven\'t reported — and won\'t, without persuasion.',
      'Has overheard conversations they definitely shouldn\'t have.',
      'Looking for a discreet buyer for something they shouldn\'t possess.',
      'Owes credits they cannot repay and is getting nervous.',
      'Claims to have a lead on the [[whispering_archive|Whispering Archive]].',
      'Knows a way into or out of campus that isn\'t on any map.',
      'Wants revenge on another student but can\'t act directly.',
      'Has information about [[prof_oswald_crumb|Prof. Crumb\'s]] mountain research site.',
      'Looking for allies for an unauthorised expedition outside campus.',
      'Carrying something that isn\'t theirs and is afraid to give it back.',
      'Has pieced together something about the [[thornwick_consortium|Thornwick supply chain]].',
    ],

    // Items
    itemRarities: [
      {v:'Common',w:40},{v:'Uncommon',w:35},{v:'Rare',w:20},{v:'Very Rare',w:5},
    ],

    itemAdj: [
      'Academy-Issue','Reclaimed','Experimental','Weathered','Reinforced',
      'Compact','Antique','Field-Modified','Confiscated','Battered','Pristine','Oversized',
    ],

    itemTypes: [
      {n:'Longsword',k:'Weapon'},{n:'Shortsword',k:'Weapon'},{n:'Dagger',k:'Weapon'},
      {n:'Handaxe',k:'Weapon'},{n:'Quarterstaff',k:'Weapon'},{n:'Shortbow',k:'Weapon'},
      {n:'Crossbow',k:'Weapon'},{n:'Spear',k:'Weapon'},{n:'Shield',k:'Armor'},
      {n:'Leather Armor',k:'Armor'},{n:'Chain Shirt',k:'Armor'},{n:'Breastplate',k:'Armor'},
      {n:'Cloak',k:'Accessory'},{n:'Ring',k:'Accessory'},{n:'Amulet',k:'Accessory'},
      {n:'Boots',k:'Accessory'},{n:'Gloves',k:'Accessory'},{n:'Wand',k:'Wand/Rod'},
      {n:'Rod',k:'Wand/Rod'},{n:'Lantern',k:'Miscellaneous'},{n:'Flask',k:'Miscellaneous'},
      {n:'Tome',k:'Miscellaneous'},{n:'Compass',k:'Miscellaneous'},
    ],

    itemProps: {
      'Common': [
        'Glows faintly with a soft blue light on command — illuminates 5 ft, produces no heat.',
        'Always warm to the touch, even in freezing environments.',
        'Emits a faint chime when within 30 ft of a door that is currently locked.',
        'Cleans itself of mundane dirt and stains once per day.',
        'The owner always knows which direction is north.',
        'Never gets wet, regardless of exposure.',
        'Makes no sound whatsoever when set down on any surface.',
        'Floats just above the surface if placed on still water.',
      ],
      'Uncommon': [
        'Grants +1 to attack and damage rolls (weapon) or +1 AC (armor or shield).',
        'The bearer can cast Feather Fall on themselves once per day (no concentration required).',
        'Once per short rest, add +1d4 to a failed saving throw after seeing the result.',
        'While attuned, the bearer requires only 4 hours of sleep to gain the benefits of a long rest.',
        'Can be used to cast Detect Magic once per day as a ritual.',
        'Grants advantage on Perception checks in dim light or darkness.',
        'When the bearer drops to 0 HP, emits a blinding flash in a 10-ft radius (Dex DC 13 or blinded until end of next turn). Recharges at dawn.',
        'The bearer may communicate telepathically with one willing creature they can see, up to 30 ft. Simple concepts only.',
      ],
      'Rare': [
        'Grants +2 to attack and damage rolls (weapon) or +2 AC (armor or shield).',
        'Grants a flying speed of 30 ft for 1 minute, once per day.',
        'While attuned, the bearer is immune to the frightened condition.',
        'Once per long rest, automatically succeed on one death saving throw (counts as a natural 20).',
        'The bearer can cast Misty Step once per short rest (no spell slot required).',
        'Adds 1d6 force damage to all attacks (weapon) or grants resistance to one damage type chosen at attunement (armor).',
        'While worn or held, the bearer cannot be surprised.',
        'Once per day, cast Dispel Magic at 3rd level without a spell slot.',
      ],
      'Very Rare': [
        'Grants +3 to attack and damage rolls (weapon) or +3 AC (armor or shield).',
        'Has 3 charges. Expend 1 to cast Counterspell as a reaction. Regains 1d3 charges at dawn.',
        'The attuned bearer cannot be located by scrying spells or divination magic.',
        'Once per long rest, cast Plane Shift targeting only the bearer.',
        'Grants one additional attunement slot (maximum 4 total).',
      ],
    },

    sources: [
      '[[academy_provisions|Provisions Office]] stock',
      'Special Acquisitions cabinet at the Prov',
      'Field exercise — found on-site',
      'Old campus storage — unclaimed property',
      'Personal item, previous owner unknown',
      'Purchased in [[silverymoon|Silverymoon]] off-campus',
      'Confiscated from a student, officially unsealed',
    ],

    prices: {
      'Common':'50–100 AC',
      'Uncommon':'150–300 AC',
      'Rare':'500+ AC or not for sale',
      'Very Rare':'Not for sale (found only)',
    },
  };

  // ── Utility ──────────────────────────────────────────────────────────────────

  function roll(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function rollW(table) {
    const total = table.reduce((s, e) => s + e.w, 0);
    let r = Math.floor(Math.random() * total);
    for (const e of table) { r -= e.w; if (r < 0) return e.v; }
    return table[table.length - 1].v;
  }

  // ── Generators ───────────────────────────────────────────────────────────────

  function generateNPC() {
    const name  = roll(T.first) + ' ' + roll(T.last);
    const race  = rollW(T.races);
    const role  = roll(T.roles);
    const trait = roll(T.traits);
    const bond  = roll(T.bonds);
    const flaw  = roll(T.flaws);
    const build = roll(T.builds);
    const feat  = roll(T.features);
    const hook  = roll(T.hooks);
    const id    = 'gen_npc_' + Date.now();

    const content = `<article class="loc">
  <dl class="facts">
    <dt>Race</dt>        <dd>${race}</dd>
    <dt>Role</dt>        <dd>${role}</dd>
    <dt>Appearance</dt>  <dd>${build.charAt(0).toUpperCase() + build.slice(1)}, with ${feat}</dd>
  </dl>

  <h3>Personality</h3>
  <dl class="facts">
    <dt>Trait</dt><dd>${trait}</dd>
    <dt>Bond</dt> <dd>${bond}</dd>
    <dt>Flaw</dt> <dd>${flaw}</dd>
  </dl>

  <h3>Hook</h3>
  <p>${hook}</p>

  <div class="dm-only">
    <p class="dm-label">Generated — DM Notes</p>
    <p><em>Edit this content as needed. Add stats, allegiances, or additional hooks above.</em></p>
  </div>
</article>`;

    return {
      id, name, type: 'npc', category: 'Generated',
      visibility: 'dm-only', contentType: 'inline', content,
      tags: ['generated'], _generated: true,
    };
  }

  function generateItem() {
    const rarity = rollW(T.itemRarities);
    const adj    = roll(T.itemAdj);
    const type   = roll(T.itemTypes);
    const prop   = roll(T.itemProps[rarity]);
    const source = roll(T.sources);
    const name   = adj + ' ' + type.n;
    const id     = 'gen_item_' + Date.now();

    const content = `<article class="loc">
  <dl class="facts">
    <dt>Type</dt>          <dd>${type.k}</dd>
    <dt>Rarity</dt>        <dd>${rarity}</dd>
    <dt>Approx. Value</dt> <dd>${T.prices[rarity]}</dd>
    <dt>Source</dt>        <dd>${source}</dd>
  </dl>

  <h3>Property</h3>
  <p>${prop}</p>

  <div class="dm-only">
    <p class="dm-label">Generated — DM Notes</p>
    <p><em>Edit as needed. Add attunement requirements, charges, or lore above.</em></p>
  </div>
</article>`;

    return {
      id, name, type: 'item', category: 'Generated',
      visibility: 'dm-only', contentType: 'inline', content,
      tags: ['generated', rarity.toLowerCase().replace(' ', '-')], _generated: true,
    };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  function addEntity(entity) {
    _genList.push(entity);
    _genById.set(entity.id, entity);
    persistAll();
    if (!window.ENTITIES.find((x) => x.id === entity.id)) window.ENTITIES.push(entity);
    document.dispatchEvent(new CustomEvent('entities:ready'));
  }

  function removeEntity(id) {
    _genList = _genList.filter((e) => e.id !== id);
    _genById.delete(id);
    persistAll();
    const idx = window.ENTITIES.findIndex((e) => e.id === id);
    if (idx !== -1) window.ENTITIES.splice(idx, 1);
    document.dispatchEvent(new CustomEvent('entities:ready'));
  }

  function exportJSON(entity) {
    const { _generated, ...data } = entity;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = entity.id + '.json'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  let overlay, previewEl, saveBtn, exportBtn;
  let activeTab = 'npc';
  let _current  = null;

  function buildUI() {
    overlay = document.createElement('div');
    overlay.id = 'generator-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div id="generator-panel">
        <header id="generator-header">
          <h2>Generator</h2>
          <button id="generator-close" type="button" aria-label="Close">&times;</button>
        </header>
        <div id="generator-tabs">
          <button class="gen-tab gen-tab-active" data-type="npc">NPC</button>
          <button class="gen-tab" data-type="item">Item</button>
        </div>
        <div id="generator-body">
          <div id="generator-roll-area">
            <button id="gen-roll-btn" type="button">&#9860; Roll</button>
            <div id="gen-preview"><p class="modal-status">Hit Roll to generate.</p></div>
            <div id="gen-action-row">
              <button id="gen-save-btn" type="button" disabled>Add to Index</button>
              <button id="gen-export-btn" type="button" disabled>Export JSON</button>
            </div>
          </div>
          <div id="generator-saved-area">
            <p class="gen-saved-title">Saved Entities</p>
            <ul id="gen-saved-list"></ul>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    previewEl = overlay.querySelector('#gen-preview');
    saveBtn   = overlay.querySelector('#gen-save-btn');
    exportBtn = overlay.querySelector('#gen-export-btn');

    overlay.querySelector('#generator-close').addEventListener('click', closePanel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closePanel();
    });

    overlay.querySelectorAll('.gen-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.type;
        overlay.querySelectorAll('.gen-tab').forEach((b) => b.classList.remove('gen-tab-active'));
        btn.classList.add('gen-tab-active');
        _current = null;
        previewEl.innerHTML = '<p class="modal-status">Hit Roll to generate.</p>';
        saveBtn.disabled = true;
        exportBtn.disabled = true;
      });
    });

    overlay.querySelector('#gen-roll-btn').addEventListener('click', () => {
      _current = activeTab === 'npc' ? generateNPC() : generateItem();
      renderPreview(_current);
      saveBtn.disabled = false;
      exportBtn.disabled = false;
    });

    saveBtn.addEventListener('click', () => {
      if (!_current) return;
      addEntity(_current);
      renderSavedList();
      previewEl.innerHTML = '<p class="modal-status">Saved. Roll again for another.</p>';
      _current = null;
      saveBtn.disabled = true;
      exportBtn.disabled = true;
    });

    exportBtn.addEventListener('click', () => { if (_current) exportJSON(_current); });

    renderSavedList();
  }

  function renderPreview(entity) {
    previewEl.innerHTML = `
      <div class="gen-preview-card">
        <div class="gen-preview-name">
          <span class="gen-type-pill">${entity.type.toUpperCase()}</span>
          <strong>${entity.name}</strong>
        </div>
        <div class="gen-preview-body">${entity.content}</div>
      </div>`;
  }

  function renderSavedList() {
    if (!overlay) return;
    const ul = overlay.querySelector('#gen-saved-list');
    if (!ul) return;
    ul.innerHTML = '';
    if (!_genList.length) {
      ul.innerHTML = '<li class="gen-empty">No saved entities yet.</li>';
      return;
    }
    for (const e of [..._genList].reverse()) {
      const li = document.createElement('li');
      li.className = 'gen-saved-item';
      const typeSpan = document.createElement('span');
      typeSpan.className = 'gen-saved-type';
      typeSpan.textContent = e.type;
      const nameBtn = document.createElement('button');
      nameBtn.className = 'gen-saved-name';
      nameBtn.dataset.id = e.id;
      nameBtn.textContent = e.name;
      nameBtn.addEventListener('click', () => window.openLocationModal(e));
      const delBtn = document.createElement('button');
      delBtn.className = 'gen-delete-btn';
      delBtn.dataset.id = e.id;
      delBtn.setAttribute('aria-label', 'Delete ' + e.name);
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => { removeEntity(e.id); renderSavedList(); });
      li.appendChild(typeSpan);
      li.appendChild(nameBtn);
      li.appendChild(delBtn);
      ul.appendChild(li);
    }
  }

  function openPanel() {
    if (!overlay) buildUI();
    else renderSavedList();
    overlay.hidden = false;
  }
  function closePanel() { if (overlay) overlay.hidden = true; }

  // Expose and wire the topbar button.
  window.Generator = { open: openPanel, close: closePanel };

  function wire() {
    const btn = document.getElementById('generator-btn');
    if (btn) btn.addEventListener('click', openPanel);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
