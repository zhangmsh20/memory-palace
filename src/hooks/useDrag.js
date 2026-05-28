/**
 * useDrag.js
 * Encapsulates the sticky-note pointer-drag logic.
 * Call setupDrag(el) once per note element after it's mounted.
 *
 * Dependencies: showToast (passed in), startNoteFloat / stopNoteFloat (passed in)
 */

/** Spawn upward fire / paper fragments and remove element */
function animDeleteUp(el, px, py, showToast) {
  if (px === undefined) px = parseFloat(el.dataset.px) || 0;
  if (py === undefined) py = parseFloat(el.dataset.py) || 0;
  const r = parseFloat(el.dataset.r) || 0;
  el.style.transition = 'transform .45s cubic-bezier(.4,0,.6,1),opacity .4s ease,filter .3s ease';
  el.style.transform  = `translate(${px}px,${py - 220}px) rotate(${r + (-15 + Math.random() * 30)}deg) scale(0.25)`;
  el.style.opacity    = '0';
  el.style.filter     = 'brightness(2.5) saturate(0)';

  const rect = el.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const f = document.createElement('div');
    f.style.cssText = `position:fixed;width:${8 + Math.random() * 18}px;height:${5 + Math.random() * 12}px;background:rgba(240,220,180,0.7);border-radius:2px;left:${rect.left + rect.width * Math.random()}px;top:${rect.top + rect.height * Math.random()}px;pointer-events:none;z-index:9000;transition:transform .5s ease-out,opacity .5s ease-out`;
    document.body.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      f.style.transform = `translate(${-40 + Math.random() * 80}px,${-80 - Math.random() * 80}px) rotate(${Math.random() * 360}deg) scale(0)`;
      f.style.opacity   = '0';
    }));
    setTimeout(() => f.remove(), 600);
  }
  setTimeout(() => el.remove(), 460);
  showToast('💨 记忆已消散', 'rgba(180,180,255,0.8)');
}

function animPromote(el, showToast, stopNoteFloat) {
  stopNoteFloat(el);
  const sx = parseFloat(el.dataset.px) || parseFloat(el.dataset.sx) || 0;
  const sy = parseFloat(el.dataset.py) || parseFloat(el.dataset.sy) || 0;
  const r  = parseFloat(el.dataset.r)  || 0;
  el.style.transition = 'none';
  el.style.transform  = `translate(${sx}px,${sy}px) rotate(${r}deg)`;
  requestAnimationFrame(() => {
    el.style.transition = 'transform .85s cubic-bezier(.4,0,.2,1),opacity .7s ease,filter .5s ease';
    el.style.transform  = `translate(${sx}px,${sy + 160}px) rotate(${r + 8}deg) scale(0.35)`;
    el.style.opacity    = '0';
    el.style.filter     = 'saturate(2.5) brightness(1.8)';
  });
  setTimeout(() => el.remove(), 880);
  showToast('📚 已升级至书架', 'rgba(255,180,80,0.9)');
}

/**
 * Attach pointer drag behaviour to a sticky note DOM element.
 * @param {HTMLElement} el
 * @param {{ showToast, startNoteFloat, stopNoteFloat }} deps
 */
export function setupDrag(el, { showToast, startNoteFloat, stopNoteFloat }) {
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();

    stopNoteFloat(el);

    const board     = document.getElementById('sticky-board');
    const boardRect = board.getBoundingClientRect();
    const elRect    = el.getBoundingClientRect();
    const startPx   = elRect.left - boardRect.left;
    const startPy   = elRect.top  - boardRect.top;
    el.dataset.px   = startPx;
    el.dataset.py   = startPy;

    let curPx = startPx, curPy = startPy;
    const startClientX = e.clientX, startClientY = e.clientY;
    let rafPending = false;

    el.classList.add('dragging');
    el.style.zIndex     = '500';
    el.style.transition = 'none';
    el.style.transform  = `translate(${startPx}px,${startPy}px) rotate(${parseFloat(el.dataset.r) || 0}deg) scale(1)`;

    const dropZone     = document.getElementById('shelf-drop-zone');
    const dissolveZone = document.getElementById('dissolve-zone');
    dropZone.classList.add('visible');

    function applyMove() {
      rafPending = false;
      const baseR = parseFloat(el.dataset.r) || 0;
      const dx    = curPx - startPx;
      const tilt  = Math.max(-8, Math.min(8, dx * 0.025));
      el.style.transform = `translate(${curPx}px,${curPy}px) rotate(${baseR + tilt}deg) scale(1.06)`;

      const bh         = window.innerHeight;
      const noteCenter = curPy + 70;
      if (noteCenter > bh * 0.8) dropZone.classList.add('hot');
      else dropZone.classList.remove('hot');

      const topEdge           = curPy;
      const dissolveThreshold = bh * 0.22;
      if (topEdge < dissolveThreshold) {
        dissolveZone.classList.add('visible');
        el.classList.add('danger-zone');
        const ratio = Math.min(1, (dissolveThreshold - topEdge) / (bh * 0.15));
        el.style.filter = `brightness(${1 + ratio * 0.6}) saturate(${1 - ratio * 0.85}) hue-rotate(${ratio * -20}deg)`;
      } else {
        dissolveZone.classList.remove('visible');
        el.classList.remove('danger-zone');
        el.style.filter = '';
      }
    }

    function onMove(ev) {
      ev.preventDefault();
      curPx = startPx + (ev.clientX - startClientX);
      curPy = startPy + (ev.clientY - startClientY);
      if (!rafPending) { rafPending = true; requestAnimationFrame(applyMove); }
    }

    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
      document.removeEventListener('pointercancel', onUp);

      el.classList.remove('dragging', 'danger-zone');
      el.style.filter = '';
      dropZone.classList.remove('visible', 'hot');
      dissolveZone.classList.remove('visible');

      const bh         = window.innerHeight;
      const noteCenter = curPy + 70;
      const topEdge    = curPy;

      if (noteCenter > bh * 0.8) {
        animPromote(el, showToast, stopNoteFloat);
      } else if (topEdge < bh * 0.22) {
        el.style.transform  = `translate(${curPx}px,${curPy}px) rotate(${parseFloat(el.dataset.r) || 0}deg) scale(1.06)`;
        el.style.transition = 'box-shadow .2s,filter .2s';
        el.style.boxShadow  = '3px 6px 20px rgba(0,0,0,0.6),0 0 0 2px rgba(255,80,80,0.9),0 0 40px rgba(255,60,60,0.7)';
        el.style.filter     = 'brightness(1.4) saturate(0.1) hue-rotate(-20deg)';
        showToast('💨 记忆正在消散…', 'rgba(255,120,80,0.9)');
        setTimeout(() => animDeleteUp(el, curPx, curPy, showToast), 320);
      } else {
        el.dataset.px   = curPx;
        el.dataset.py   = curPy;
        el.style.transform = `translate(${curPx}px,${curPy}px) rotate(${parseFloat(el.dataset.r) || 0}deg)`;
        el.style.zIndex = '10';
        setTimeout(() => startNoteFloat(el, Math.random() * 10), 50);
      }
    }

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup',   onUp);
    document.addEventListener('pointercancel', onUp);
  });
}
