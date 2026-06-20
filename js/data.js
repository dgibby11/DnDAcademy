// data.js — loads the entity data set and provides shared app state.
//
// Entities live in per-type files under /data (locations.json, npcs.json,
// factions.json, items.json, creatures.json, mysteries.json, sessions.json).
// data/index.json is a manifest listing those files. To add a new type file,
// add its name to index.json — no code change needed.
//
// Exposes:
//   window.ENTITIES                  merged array of all entity objects
//   window.App.isDM()                is DM mode currently on?
//   window.App.setDM(on)             set DM mode, fires `dm:changed`
//   window.App.toggleDM()            flip DM mode
//   window.App.isVisible(entity)     should this entity show right now?
//   window.App.byId(id)              look up an entity by id (or undefined)
//
// Events dispatched on `document`:
//   entities:ready  { entities }     data finished loading
//   dm:changed      { on }           DM mode toggled
//
// Note on opening via file://: browsers block fetch() of local files. Run the
// app through the bundled static server (start-map.bat) so fetch works.

(function () {
  window.ENTITIES = [];
  let byIdMap = new Map();

  window.App = {
    isDM() {
      return document.body.classList.contains("dm-on");
    },
    setDM(on) {
      document.body.classList.toggle("dm-on", !!on);
      document.dispatchEvent(
        new CustomEvent("dm:changed", { detail: { on: !!on } })
      );
    },
    toggleDM() {
      this.setDM(!this.isDM());
    },
    isVisible(entity) {
      return entity.visibility !== "dm-only" || this.isDM();
    },
    byId(id) {
      return byIdMap.get(id);
    },
  };

  function announce(entities) {
    window.ENTITIES = entities;
    byIdMap = new Map(entities.map((e) => [e.id, e]));
    document.dispatchEvent(
      new CustomEvent("entities:ready", { detail: { entities } })
    );
    console.info(`[data] Loaded ${entities.length} entit(ies).`);
  }

  function fail(err) {
    console.error(
      "[data] Could not load entity data.\n" +
        "If you opened index.html by double-clicking, your browser may be " +
        "blocking local file access. Run the bundled server instead " +
        "(start-map.bat) and open http://localhost:8000/.\n" +
        "Original error:",
      err
    );
    const banner = document.getElementById("load-error");
    if (banner) banner.hidden = false;
  }

  // Load the manifest, then every file it lists. A missing/broken individual
  // file is skipped (logged) rather than failing the whole load.
  fetch("data/index.json")
    .then((res) => {
      if (!res.ok) throw new Error(`index.json HTTP ${res.status}`);
      return res.json();
    })
    .then((files) => {
      if (!Array.isArray(files)) throw new Error("index.json is not an array");
      return Promise.all(
        files.map((fn) =>
          fetch(`data/${fn}`)
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.json();
            })
            .then((arr) => {
              if (!Array.isArray(arr)) throw new Error("not an array");
              return arr;
            })
            .catch((e) => {
              console.warn(`[data] Skipped data/${fn}:`, e.message);
              return [];
            })
        )
      );
    })
    .then((groups) => announce(groups.flat()))
    .catch(fail);
})();
