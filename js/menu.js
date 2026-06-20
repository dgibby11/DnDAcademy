// menu.js — the slide-out Index panel + the DM-mode toggle.
//
// The Index lists every currently-visible entity, grouped by TYPE (collapsible)
// and then by category within each type. Clicking an entry opens its modal.
// dm-only entities appear only when DM mode is on; the list re-renders whenever
// DM mode changes.

(function () {
  // Display order + labels for entity types. Any type not listed is appended.
  const TYPE_ORDER = [
    "reference",
    "location",
    "npc",
    "faction",
    "item",
    "creature",
    "mystery",
    "session",
  ];
  const TYPE_LABELS = {
    reference: "Reference",
    location: "Locations",
    npc: "People",
    faction: "Factions",
    item: "Items & Artifacts",
    creature: "Creatures",
    mystery: "Mysteries",
    session: "Sessions",
  };

  let panel, listEl, toggleBtn;

  function orderedTypes(entities) {
    const present = [];
    for (const e of entities) if (!present.includes(e.type)) present.push(e.type);
    const known = TYPE_ORDER.filter((t) => present.includes(t));
    const extra = present.filter((t) => !TYPE_ORDER.includes(t));
    return [...known, ...extra];
  }

  function orderedCategories(group) {
    const cats = [];
    for (const e of group) {
      const c = e.category || "";
      if (!cats.includes(c)) cats.push(c);
    }
    return cats;
  }

  function makeItem(entity) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-item";
    if (entity.visibility === "dm-only") btn.classList.add("menu-item-dm");
    btn.textContent = entity.name;
    btn.addEventListener("click", () => {
      window.openLocationModal(entity);
    });
    return btn;
  }

  function renderList() {
    if (!listEl) return;
    const visible = window.ENTITIES.filter((e) => window.App.isVisible(e));
    listEl.innerHTML = "";

    for (const type of orderedTypes(visible)) {
      const group = visible.filter((e) => e.type === type);
      if (!group.length) continue;

      const details = document.createElement("details");
      details.className = "menu-type";
      details.open = true;

      const summary = document.createElement("summary");
      summary.className = "menu-type-title";
      summary.innerHTML = `<span>${TYPE_LABELS[type] || type}</span><span class="menu-count">${group.length}</span>`;
      details.appendChild(summary);

      for (const category of orderedCategories(group)) {
        const inCat = group.filter((e) => (e.category || "") === category);
        if (category) {
          const h = document.createElement("h4");
          h.className = "menu-cat-title";
          h.textContent = category;
          details.appendChild(h);
        }
        const ul = document.createElement("ul");
        for (const e of inCat) {
          const li = document.createElement("li");
          li.appendChild(makeItem(e));
          ul.appendChild(li);
        }
        details.appendChild(ul);
      }
      listEl.appendChild(details);
    }
  }

  function openPanel() {
    panel.classList.add("open");
    document.body.classList.add("panel-open");
    panel.setAttribute("aria-hidden", "false");
  }
  function closePanel() {
    panel.classList.remove("open");
    document.body.classList.remove("panel-open");
    panel.setAttribute("aria-hidden", "true");
  }
  function togglePanel() {
    panel.classList.contains("open") ? closePanel() : openPanel();
  }

  function updateToggleLabel() {
    if (!toggleBtn) return;
    const on = window.App.isDM();
    toggleBtn.textContent = on ? "DM Mode: ON" : "DM Mode: OFF";
    toggleBtn.classList.toggle("dm-active", on);
    toggleBtn.setAttribute("aria-pressed", String(on));
  }

  function wire() {
    panel = document.getElementById("locations-panel");
    listEl = document.getElementById("locations-list");
    toggleBtn = document.getElementById("dm-toggle");

    const openBtn = document.getElementById("open-menu");
    const closeBtn = document.getElementById("close-menu");
    const backdrop = document.getElementById("panel-backdrop");

    if (openBtn) openBtn.addEventListener("click", openPanel);
    if (closeBtn) closeBtn.addEventListener("click", closePanel);
    if (backdrop) backdrop.addEventListener("click", closePanel);
    if (toggleBtn) toggleBtn.addEventListener("click", () => window.App.toggleDM());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });

    document.addEventListener("entities:ready", renderList);
    document.addEventListener("dm:changed", () => {
      renderList();
      updateToggleLabel();
    });

    updateToggleLabel();
    if (window.ENTITIES.length) renderList();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
