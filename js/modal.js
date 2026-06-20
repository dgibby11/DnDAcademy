// modal.js — the content modal.
//
// Exposes window.openLocationModal(entity). Renders the entity's content by
// contentType (html / image / pdf), then appends two generated sections:
//   • Related   — internal cross-links from entity.related[]
//   • References — external links from entity.links[] (open in a new tab)
//
// Inside html content, [[id]] or [[id|Display Text]] tokens are resolved into
// clickable cross-links that open the target entity. Unknown ids render as
// dimmed "broken" links so typos are visible while authoring. Links to dm-only
// entities render as plain text unless DM mode is on.

(function () {
  let overlay, titleEl, bodyEl, lastFocus;

  function build() {
    overlay = document.createElement("div");
    overlay.id = "modal-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header id="modal-header">
          <h2 id="modal-title"></h2>
          <button id="modal-close" type="button" aria-label="Close">&times;</button>
        </header>
        <div id="modal-body"></div>
      </div>`;
    document.body.appendChild(overlay);

    titleEl = overlay.querySelector("#modal-title");
    bodyEl = overlay.querySelector("#modal-body");

    overlay.querySelector("#modal-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) close();
    });
    // Delegate cross-link clicks (content links + Related links).
    bodyEl.addEventListener("click", (e) => {
      const a = e.target.closest(".xlink[data-id]");
      if (!a) return;
      e.preventDefault();
      const target = window.App.byId(a.getAttribute("data-id"));
      if (target) open(target);
    });
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
      const span = document.createElement("span");
      span.className = "xlink xlink-broken";
      span.title = `Unknown entity: ${id}`;
      span.textContent = text;
      return span;
    }
    if (!window.App.isVisible(target)) {
      // dm-only target while in player view → show plain text, no link
      return document.createTextNode(text);
    }
    const a = document.createElement("a");
    a.className = "xlink";
    a.href = "#";
    a.setAttribute("data-id", id);
    a.textContent = text;
    return a;
  }

  function relatedLink(target) {
    const a = document.createElement("a");
    a.className = "xlink";
    a.href = "#";
    a.setAttribute("data-id", target.id);
    a.textContent = target.name;
    if (target.visibility === "dm-only") a.classList.add("xlink-dm");
    return a;
  }

  function appendExtras(loc) {
    // Related (internal cross-links), filtered to visible entities.
    const related = (loc.related || [])
      .map((id) => window.App.byId(id))
      .filter((e) => e && window.App.isVisible(e));
    if (related.length) {
      const sec = document.createElement("section");
      sec.className = "modal-related";
      const h = document.createElement("h3");
      h.textContent = "Related";
      sec.appendChild(h);
      const ul = document.createElement("ul");
      for (const t of related) {
        const li = document.createElement("li");
        li.appendChild(relatedLink(t));
        ul.appendChild(li);
      }
      sec.appendChild(ul);
      bodyEl.appendChild(sec);
    }

    // References (external links).
    const links = loc.links || [];
    if (links.length) {
      const sec = document.createElement("section");
      sec.className = "modal-references";
      const h = document.createElement("h3");
      h.textContent = "References";
      sec.appendChild(h);
      const ul = document.createElement("ul");
      for (const ln of links) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = ln.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.className = "ext-link";
        a.textContent = ln.label || ln.url;
        li.appendChild(a);
        ul.appendChild(li);
      }
      sec.appendChild(ul);
      bodyEl.appendChild(sec);
    }
  }

  function open(loc) {
    if (!overlay) build();
    if (!loc) return;

    lastFocus = document.activeElement;
    titleEl.textContent = loc.name;
    bodyEl.innerHTML = '<p class="modal-status">Loading…</p>';
    bodyEl.scrollTop = 0;
    overlay.hidden = false;
    overlay.querySelector("#modal-close").focus();

    const type = loc.contentType;
    const file = loc.contentFile;

    if (type === "image") {
      bodyEl.innerHTML = `<div class="modal-image"><img src="${file}" alt="${loc.name}" /></div>`;
      appendExtras(loc);
    } else if (type === "pdf") {
      bodyEl.innerHTML = `
        <div class="modal-pdf">
          <iframe src="${file}" title="${loc.name}"></iframe>
          <p class="modal-fallback">
            Can't see the document?
            <a href="${file}" target="_blank" rel="noopener">Open the PDF in a new tab</a>.
          </p>
        </div>`;
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
          console.error("[modal] content load failed:", file, err);
        });
    }
  }

  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    bodyEl.innerHTML = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  window.openLocationModal = open;
})();
