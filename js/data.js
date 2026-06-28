// data.js — loads campaign config + entity data.
//
// Reads ?campaign=<id> from the URL and sets:
//   window.CAMPAIGN_BASE  'campaigns/<id>'  — prefix for all asset/data fetches
//   window.CAMPAIGN       campaign configuration object (sync defaults, then overridden
//                         by campaigns/<id>/campaign.json)
//   window.ENTITIES       merged array of all entity objects
//
// If no ?campaign= param is present, or the id is not listed in campaigns/index.json,
// the user is redirected to launcher.html.
//
// window.App methods:
//   isDM()               is DM mode currently on?
//   setDM(on)            set DM mode, fires `dm:changed`
//   toggleDM()           flip DM mode
//   isVisible(entity)    should this entity show right now?
//   byId(id)             look up an entity by id (or undefined)
//
// Events dispatched on `document`:
//   entities:ready  { entities }     data finished loading
//   dm:changed      { on }           DM mode toggled

(function () {
  // ── Campaign selection ─────────────────────────────────────────────────────
  const urlParams  = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaign');

  // No campaign specified — send to launcher.
  if (!campaignId) {
    window.location.replace('launcher.html');
    return;
  }

  // ── Synchronous defaults ───────────────────────────────────────────────────
  // Set CAMPAIGN and App immediately (before any fetch) so that scripts loaded
  // after data.js as <script> tags (state.js, etc.) can read window.CAMPAIGN
  // synchronously without waiting for any async operation to complete.
  const CAMPAIGN_BASE = 'campaigns/' + campaignId;
  window.CAMPAIGN_BASE = CAMPAIGN_BASE;

  window.CAMPAIGN = {
    id:           campaignId,
    name:         'TT Adventure Sessionbook',
    subtitle:     '',
    regionMapEntity: '',
    rootLocation: 'campus_root',
    storageKey:   campaignId + '.v1',
    dmPassHash:   '',
    github: { owner: '', repo: '', stateFile: 'campaign-state.json' },
  };

  window.ENTITIES = [];
  let byIdMap = new Map();

  window.App = {
    isDM() {
      return document.body.classList.contains('dm-on');
    },
    setDM(on) {
      document.body.classList.toggle('dm-on', !!on);
      document.dispatchEvent(
        new CustomEvent('dm:changed', { detail: { on: !!on } })
      );
    },
    toggleDM() {
      this.setDM(!this.isDM());
    },
    isVisible(entity) {
      if (this.isDM()) return true;
      return entity.visibility === 'player' && !!this.isRevealed?.(entity.id);
    },
    byId(id) {
      return byIdMap.get(id);
    },
  };

  // ── Campaign registry validation ───────────────────────────────────────────
  // Validate campaign ID against the registry before loading anything.
  // If the ID is not listed, or index.json can't be fetched, redirect to launcher.
  fetch('campaigns/index.json')
    .then(function (r) {
      if (!r.ok) throw new Error('index.json not found');
      return r.json();
    })
    .then(function (list) {
      if (!list.some(function (c) { return c.id === campaignId; })) {
        window.location.replace('launcher.html');
        return;
      }
      initCampaign(campaignId);
    })
    .catch(function () {
      // index.json unreachable — refuse to load any campaign.
      window.location.replace('launcher.html');
    });

  // ── Campaign init ──────────────────────────────────────────────────────────
  // Called after registry validation passes. Loads campaign.json overrides
  // and entity data. window.CAMPAIGN and window.App are already set above.
  function initCampaign(id) {

    // Resolve a path written in campaign.json relative to the campaign root.
    // Absolute URLs and already-rooted paths pass through unchanged.
    function resolveCampaignPath(p) {
      if (!p || p.startsWith('http') || p.startsWith('/')) return p;
      return CAMPAIGN_BASE + '/' + p;
    }

    function applyConfig(cfg) {
      Object.assign(window.CAMPAIGN, cfg);
      document.title = window.CAMPAIGN.name;
      const h1  = document.querySelector('#topbar h1');
      const sub = document.querySelector('#topbar .subtitle');
      if (h1)  h1.textContent  = window.CAMPAIGN.name;
      if (sub) sub.textContent = window.CAMPAIGN.subtitle;
    }

    // Override defaults from campaign.json (non-fatal if missing).
    fetch(CAMPAIGN_BASE + '/campaign.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((cfg) => applyConfig(cfg))
      .catch(() => applyConfig({}));

    // ── Entity loading ─────────────────────────────────────────────────────
    function announce(entities) {
      window.ENTITIES = entities;
      byIdMap = new Map(entities.map((e) => [e.id, e]));
      document.dispatchEvent(
        new CustomEvent('entities:ready', { detail: { entities } })
      );
      console.info(`[data] Loaded ${entities.length} entit(ies) for campaign "${id}".`);
    }

    function fail(err) {
      console.error(
        '[data] Could not load entity data.\n' +
          'If you opened index.html by double-clicking, your browser may be ' +
          'blocking local file access. Run the bundled server instead ' +
          '(start-map.bat) and open http://localhost:8000/launcher.html.\n' +
          'Original error:',
        err
      );
      const banner = document.getElementById('load-error');
      if (banner) banner.hidden = false;
    }

    // Load the manifest, then every file it lists. A missing/broken individual
    // file is skipped (logged) rather than failing the whole load.
    fetch(CAMPAIGN_BASE + '/data/index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`index.json HTTP ${res.status}`);
        return res.json();
      })
      .then((files) => {
        if (!Array.isArray(files)) throw new Error('index.json is not an array');
        return Promise.all(
          files.map((fn) =>
            fetch(CAMPAIGN_BASE + '/data/' + fn)
              .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
              })
              .then((arr) => {
                if (!Array.isArray(arr)) throw new Error('not an array');
                return arr;
              })
              .catch((e) => {
                console.warn(`[data] Skipped ${CAMPAIGN_BASE}/data/${fn}:`, e.message);
                return [];
              })
          )
        );
      })
      .then((groups) => announce(groups.flat()))
      .catch(fail);
  } // end initCampaign
})();
