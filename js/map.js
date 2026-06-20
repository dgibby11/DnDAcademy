// map.js — renders clickable hotspot regions over the campus map.
//
// Each hotspot is an invisible clickable box centered on the location's x/y
// (which marks the centre of its map label/banner). A box shows only if the
// location has BOTH x and y and is currently visible (player, or dm-only while
// DM mode is on). Locations without coordinates live in the Locations menu only.
//
// Box size defaults to DEFAULT_W x DEFAULT_H (percent of the map). A location
// may override either with its own "w" / "h" fields for tighter/looser fit.
//
// Coordinates are plotted with tools/coordinate-picker.html.

(function () {
  const DEFAULT_W = 12; // percent of map width
  const DEFAULT_H = 6;  // percent of map height

  let layer;

  function hasCoords(loc) {
    return typeof loc.x === "number" && typeof loc.y === "number";
  }

  function render() {
    if (!layer) layer = document.getElementById("hotspot-layer");
    if (!layer) return;
    layer.innerHTML = "";

    const spots = window.ENTITIES.filter(
      (l) => hasCoords(l) && window.App.isVisible(l)
    );

    for (const loc of spots) {
      const box = document.createElement("button");
      box.type = "button";
      box.className = "hotspot";
      if (loc.visibility === "dm-only") box.classList.add("hotspot-dm");
      box.style.left = loc.x + "%";
      box.style.top = loc.y + "%";
      box.style.width = (typeof loc.w === "number" ? loc.w : DEFAULT_W) + "%";
      box.style.height = (typeof loc.h === "number" ? loc.h : DEFAULT_H) + "%";
      box.setAttribute("aria-label", loc.name);
      box.addEventListener("click", () => window.openLocationModal(loc));
      layer.appendChild(box);
    }
  }

  // Expose for menu.js / others that may want to force a redraw.
  window.renderHotspots = render;

  document.addEventListener("entities:ready", render);
  document.addEventListener("dm:changed", render);
})();
