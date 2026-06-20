// dice.js — Dice roller dropdown in the topbar.
//
// Click #dice-btn to toggle the panel. Die selector shows d4/d6/d8/d10/d12/d20/d100
// as SVG shapes. Click a die to select it (click the same die again to increment
// count). Enter the count, hit Roll. Results stack newest-first, limited to 12 rolls.

(function () {
  // SVG font-size in viewBox units, scaled by text length so values always fit.
  // Using SVG attribute (not CSS) so it scales with the viewBox rather than
  // being fixed in screen pixels.
  function fsize(v) {
    const n = String(v).length;
    return n >= 4 ? 9 : n === 3 ? 11 : n === 2 ? 15 : 18;
  }

  // Each template places text at the shape's centroid with dominant-baseline="central"
  // so the font-size can vary freely without breaking vertical alignment.
  const SHAPES = {
    // d4: upward equilateral triangle — centroid y = (3+46+46)/3 ≈ 32
    4:   (v) => `<svg viewBox="0 0 50 50" class="die-svg"><polygon points="25,3 48,46 2,46"/><text x="25" y="32" font-size="${fsize(v)}" dominant-baseline="central">${v}</text></svg>`,
    // d6: square
    6:   (v) => `<svg viewBox="0 0 50 50" class="die-svg"><rect x="2" y="2" width="46" height="46" rx="4"/><text x="25" y="25" font-size="${fsize(v)}" dominant-baseline="central">${v}</text></svg>`,
    // d8: diamond
    8:   (v) => `<svg viewBox="0 0 50 50" class="die-svg"><polygon points="25,2 48,25 25,48 2,25"/><text x="25" y="25" font-size="${fsize(v)}" dominant-baseline="central">${v}</text></svg>`,
    // d10: wide pentagon — centroid y ≈ 26
    10:  (v) => `<svg viewBox="0 0 50 50" class="die-svg"><polygon points="25,2 44,18 38,46 12,46 6,18"/><text x="25" y="26" font-size="${fsize(v)}" dominant-baseline="central">${v}</text></svg>`,
    // d12: regular pentagon — centroid y ≈ 25
    12:  (v) => `<svg viewBox="0 0 50 50" class="die-svg"><polygon points="25,1 47,17 39,43 11,43 3,17"/><text x="25" y="25" font-size="${fsize(v)}" dominant-baseline="central">${v}</text></svg>`,
    // d20: circle (icosahedron approximated as circle)
    20:  (v) => `<svg viewBox="0 0 50 50" class="die-svg"><circle cx="25" cy="25" r="22"/><text x="25" y="25" font-size="${fsize(v)}" dominant-baseline="central">${v}</text></svg>`,
    // d100: octagon — distinct from the d20 circle
    100: (v) => `<svg viewBox="0 0 50 50" class="die-svg"><polygon points="15,2 35,2 48,15 48,35 35,48 15,48 2,35 2,15"/><text x="25" y="25" font-size="${fsize(v)}" dominant-baseline="central">${v}</text></svg>`,
  };

  const DICE = [4, 6, 8, 10, 12, 20, 100];

  let panel, resultArea, numInput, activeLabel;
  let activeDie = 20;

  // ── Roll logic ──────────────────────────────────────────────────────────────

  function randInt(sides) { return Math.floor(Math.random() * sides) + 1; }

  function doRoll() {
    const n      = Math.max(1, Math.min(20, parseInt(numInput.value, 10) || 1));
    const values = Array.from({ length: n }, () => randInt(activeDie));
    const total  = values.reduce((s, v) => s + v, 0);

    const row = document.createElement('div');
    row.className = 'dice-result-row';

    const diceEl = document.createElement('div');
    diceEl.className = 'dice-result-dice';

    for (const v of values) {
      const span = document.createElement('span');
      span.className = 'dice-result-die';
      span.innerHTML = SHAPES[activeDie](v);
      diceEl.appendChild(span);
    }
    if (n > 1) {
      const tot = document.createElement('span');
      tot.className = 'dice-result-total';
      tot.textContent = '= ' + total;
      diceEl.appendChild(tot);
    }

    row.appendChild(diceEl);
    resultArea.insertBefore(row, resultArea.firstChild);

    // cap history
    while (resultArea.children.length > 12) resultArea.removeChild(resultArea.lastChild);
  }

  // ── Build panel ─────────────────────────────────────────────────────────────

  function setActive(sides) {
    activeDie = sides;
    activeLabel.textContent = sides === 100 ? 'd%' : 'd' + sides;
    panel.querySelectorAll('.die-btn').forEach((b) =>
      b.classList.toggle('die-btn-active', +b.dataset.sides === sides));
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'dice-panel';
    panel.hidden = true;

    // Die selector
    const selector = document.createElement('div');
    selector.id = 'dice-selector';
    for (const d of DICE) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'die-btn' + (d === activeDie ? ' die-btn-active' : '');
      btn.dataset.sides = d;
      btn.title = d === 100 ? 'd100' : 'd' + d;
      btn.innerHTML = SHAPES[d](d === 100 ? 'd%' : 'd' + d);
      btn.addEventListener('click', () => {
        if (+btn.dataset.sides === activeDie) {
          // same die clicked again — increment count (capped at 20)
          numInput.value = Math.min(20, parseInt(numInput.value, 10) + 1);
        } else {
          numInput.value = 1;
          setActive(d);
        }
      });
      selector.appendChild(btn);
    }

    // Controls row
    const controls = document.createElement('div');
    controls.id = 'dice-controls';

    numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.id = 'dice-num';
    numInput.min = 1; numInput.max = 20; numInput.value = 1;
    numInput.setAttribute('aria-label', 'Number of dice');

    activeLabel = document.createElement('span');
    activeLabel.className = 'dice-active-label';
    activeLabel.textContent = 'd20';

    const rollBtn = document.createElement('button');
    rollBtn.type = 'button';
    rollBtn.id = 'dice-roll-btn';
    rollBtn.textContent = 'Roll';
    rollBtn.addEventListener('click', doRoll);

    // Also roll on Enter in the count input
    numInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRoll(); });

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.id = 'dice-clear-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => { resultArea.innerHTML = ''; });

    controls.appendChild(numInput);
    controls.appendChild(activeLabel);
    controls.appendChild(rollBtn);
    controls.appendChild(clearBtn);

    resultArea = document.createElement('div');
    resultArea.id = 'dice-result-area';

    panel.appendChild(selector);
    panel.appendChild(controls);
    panel.appendChild(resultArea);

    const wrap = document.getElementById('dice-wrap');
    (wrap || document.body).appendChild(panel);
  }

  // ── Toggle ──────────────────────────────────────────────────────────────────

  function openPanel() {
    if (!panel) buildPanel();
    panel.hidden = !panel.hidden;
    if (!panel.hidden) numInput && numInput.focus();
  }

  // ── Wire ────────────────────────────────────────────────────────────────────

  function wire() {
    const btn = document.getElementById('dice-btn');
    if (!btn) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); openPanel(); });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (panel && !panel.hidden) {
        const wrap = document.getElementById('dice-wrap');
        if (wrap && !wrap.contains(e.target)) panel.hidden = true;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel && !panel.hidden) panel.hidden = true;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
