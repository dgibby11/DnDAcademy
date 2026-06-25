// state.js — persistent campaign state via localStorage.
//
// Shape (key determined by campaign.json → storageKey, e.g. "lost-mine.v1"):
//   { revealed: { "<id>": true }, notes: { "<id>": "..." },
//     currentLocationId: string|null, timeOfDay: "dawn"|"day"|"dusk"|"night" }
//
// Extends window.App (already created by data.js) with:
//   App.isRevealed(id)        → boolean
//   App.setRevealed(id, bool) → persist + fire campaign:changed
//   App.getNote(id)           → string (empty string if none)
//   App.setNote(id, text)     → persist (no event — notes are DM-private)
//   App.getTimeOfDay()        → "dawn"|"day"|"dusk"|"night"
//   App.setTimeOfDay(t)       → persist + fire time:changed

(function () {
  // Reads from window.CAMPAIGN (set synchronously by data.js before this runs).
  // To use a different key for a new campaign, update campaign.json's storageKey.
  const KEY = window.CAMPAIGN.storageKey;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(_state)); }
    catch (e) { console.warn('[state] localStorage write failed:', e); }
    if (window.GitHubState) window.GitHubState.sync(_state);
  }

  const _state = load();
  if (!_state.revealed)           _state.revealed           = {};
  if (!_state.notes)              _state.notes              = {};
  if (!('currentLocationId' in _state)) _state.currentLocationId = null;
  if (!_state.timeOfDay)          _state.timeOfDay          = 'day';

  Object.assign(window.App, {
    isRevealed(id) {
      return !!_state.revealed[id];
    },
    setRevealed(id, bool) {
      if (bool) _state.revealed[id] = true;
      else      delete _state.revealed[id];
      save();
      document.dispatchEvent(
        new CustomEvent('campaign:changed', { detail: { id, revealed: !!bool } })
      );
    },
    getNote(id) {
      return _state.notes[id] || '';
    },
    setNote(id, text) {
      const t = (text || '').trim();
      if (t) _state.notes[id] = t;
      else   delete _state.notes[id];
      save();
    },

    getCurrentLocationId() {
      return _state.currentLocationId || null;
    },
    setCurrentLocation(id) {
      _state.currentLocationId = id || null;
      save();
      document.dispatchEvent(new CustomEvent('location:changed', { detail: { id: _state.currentLocationId } }));
    },
    clearLocation() {
      this.setCurrentLocation(null);
    },

    getTimeOfDay() {
      return _state.timeOfDay || 'day';
    },
    setTimeOfDay(t) {
      _state.timeOfDay = t;
      save();
      document.dispatchEvent(new CustomEvent('time:changed', { detail: { time: t } }));
    },
  });

  // The revealed flag is DM tracking only — it does not gate visibility.
  // isVisible() in data.js already handles DM vs player mode correctly:
  //   DM view: everything (dm-only + player).
  //   Player view: only player-visibility entities (dm-only hidden).
  // The reveal toggle in the modal lets the DM mark what the party has discovered.
})();
