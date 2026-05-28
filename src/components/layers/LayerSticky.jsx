import { useEffect, useRef } from 'react';
import { STICKY_DATA, TIME_BANDS, TAG_HEX_MAP } from '../../data/stickyNotes';
import { setupDrag } from '../../hooks/useDrag';
import { decayLabel } from '../../utils/decay';

// ── float engine (module-level to persist across renders) ──
const floatTimers = new WeakMap();
function startNoteFloat(el, phase) {
  let t = (phase || 0) * 1000;
  const period = 4500 + Math.random() * 1500;
  function tick() {
    t += 16;
    const bob = Math.sin(t / period * Math.PI * 2) * 5;
    const px = parseFloat(el.dataset.px) || 0;
    const py = parseFloat(el.dataset.py) || 0;
    const r  = parseFloat(el.dataset.r)  || 0;
    el.style.transform = `translate(${px}px,${py + bob}px) rotate(${r}deg)`;
    floatTimers.set(el, requestAnimationFrame(tick));
  }
  floatTimers.set(el, requestAnimationFrame(tick));
}
function stopNoteFloat(el) {
  const id = floatTimers.get(el);
  if (id) cancelAnimationFrame(id);
  floatTimers.delete(el);
}

function showToast(msg, col = 'rgba(80,220,180,0.9)') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.style.color = col;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function advanceDecayEl(el) {
  const cur  = el.dataset.decay;
  const next = { fresh: 'cooling', cooling: 'fading', fading: 'critical' }[cur];
  if (!next) return;
  el.dataset.decay = next;
  ['fresh','cooling','fading','critical'].forEach(d => el.classList.remove('decay-' + d));
  el.classList.add('decay-' + next);
  const tEl = el.querySelector('.s-time');
  if (tEl) tEl.textContent = decayLabel(next);
}

function animDissolve(el) {
  stopNoteFloat(el);
  const px = parseFloat(el.dataset.px) || 0;
  const py = parseFloat(el.dataset.py) || 0;
  const r  = parseFloat(el.dataset.r)  || 0;
  el.style.transition = 'none';
  el.style.transform  = `translate(${px}px,${py}px) rotate(${r}deg)`;
  requestAnimationFrame(() => {
    el.style.transition = 'transform 2s ease-out,opacity 1.8s ease,filter 1.5s ease';
    el.style.transform  = `translate(${px}px,${py - 60}px) rotate(${r - 1.5}deg) scale(0.85)`;
    el.style.opacity    = '0';
    el.style.filter     = 'saturate(0) brightness(0.5)';
  });
  setTimeout(() => el.remove(), 2000);
  showToast('🌊 记忆已自然消散', 'rgba(130,100,255,0.8)');
}

function spawnBubble(board) {
  const bw   = board.offsetWidth  || window.innerWidth;
  const bh   = board.offsetHeight || window.innerHeight;
  const rv   = Math.random();
  const size = rv < 0.6 ? 5 + Math.random() * 8 : rv < 0.88 ? 13 + Math.random() * 7 : 20 + Math.random() * 6;
  const x    = 20 + Math.random() * (bw - 40);
  const y    = bh * 0.3 + Math.random() * (bh * 0.65);
  const dur  = 9 + Math.random() * 10;
  const del  = Math.random() * 2;
  const bx1  = (Math.random() - 0.5) * 30;
  const bx2  = (Math.random() - 0.5) * 50;
  const bx3  = (Math.random() - 0.5) * 30;
  const bx4  = (Math.random() - 0.5) * 20;
  const opacity = size < 10 ? 0.12 + Math.random() * 0.10 : size < 16 ? 0.15 + Math.random() * 0.12 : 0.18 + Math.random() * 0.10;

  const el = document.createElement('div');
  el.className = 'memory-bubble';
  el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;--bdur:${dur}s;--bdel:${del}s;--bopacity:${opacity};--bx1:${bx1}px;--bx2:${bx2}px;--bx3:${bx3}px;--bx4:${bx4}px;`;
  board.appendChild(el);
  setTimeout(() => el.remove(), (dur + del) * 1000 + 200);
}

function spawnNote(d, board) {
  const el    = document.createElement('div');
  el.className = `sticky-note ${d.cls} decay-${d.decay}`;
  el.dataset.decay = d.decay;
  const bw   = window.innerWidth;
  const bh   = window.innerHeight;
  const noteW = 168;
  const px   = 180 + (d.xPct / 100) * Math.max(bw - 260 - noteW, 100);
  const [yMin, yMax] = d.yBand;
  const py   = (yMin / 100) * bh + Math.random() * ((yMax - yMin) / 100) * bh;
  el.dataset.px = px; el.dataset.py = py; el.dataset.r = d.r;
  el.style.cssText = `position:absolute;left:0;top:0;transform:translate(${px}px,${py}px) rotate(${d.r}deg);will-change:transform;z-index:10;`;
  el.innerHTML = `<div class="s-pin"></div><div class="s-badge"><div class="s-dot"></div>${d.tag}</div>${d.text}<div class="s-time">${decayLabel(d.decay)}</div>`;
  board.appendChild(el);
  startNoteFloat(el, Math.random() * 10);
  setupDrag(el, { showToast, startNoteFloat, stopNoteFloat });
}

function createNoteFromInput(text, board) {
  const cls  = ['c-green','c-blue','c-purple','c-orange','c-yellow','c-red'][Math.floor(Math.random() * 6)];
  const tags = { 'c-green':'知识','c-blue':'工作','c-purple':'偏好','c-orange':'生活','c-yellow':'情感','c-red':'关系' };
  const bw   = window.innerWidth;
  const bh   = window.innerHeight;
  const noteW = 168;
  const px   = 180 + Math.random() * (bw - 360 - noteW);
  const py   = bh * 0.62 + Math.random() * (bh * 0.13);
  const r    = -3 + Math.random() * 6;
  const el   = document.createElement('div');
  el.className = `sticky-note ${cls} decay-fresh`;
  el.dataset.decay = 'fresh'; el.dataset.px = px; el.dataset.py = py; el.dataset.r = r;
  el.style.cssText = `position:absolute;left:0;top:0;transform:translate(${px}px,${py}px) rotate(${r}deg) scale(0.3);opacity:0;will-change:transform;z-index:100;transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .3s ease;`;
  el.innerHTML = `<div class="s-pin"></div><div class="s-badge"><div class="s-dot"></div>${tags[cls]}</div>${text}<div class="s-time">刚刚</div>`;
  board.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transform = `translate(${px}px,${py}px) rotate(${r}deg) scale(1)`;
    el.style.opacity   = '1';
  }));
  setTimeout(() => { el.style.transition = ''; startNoteFloat(el, Math.random() * 10); }, 450);
  setupDrag(el, { showToast, startNoteFloat, stopNoteFloat });
  showToast('✦ 便利贴已生成');
}

export default function LayerSticky() {
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    const board = document.getElementById('sticky-board');
    if (!board) return;

    // time-band backgrounds
    TIME_BANDS.forEach(b => {
      const el    = document.createElement('div');
      el.style.cssText = `position:absolute;left:0;right:0;top:${b.yFrom*100}%;height:${(b.yTo-b.yFrom)*100}%;background:${b.color};pointer-events:none;border-top:1px solid rgba(255,255,255,0.025);z-index:0;`;
      const label = document.createElement('div');
      label.style.cssText = `position:absolute;left:8px;top:6px;font-family:'Syne Mono',monospace;font-size:8px;letter-spacing:.15em;color:rgba(255,255,255,0.1);text-transform:uppercase;`;
      label.textContent = b.label;
      el.appendChild(label);
      board.appendChild(el);
    });

    STICKY_DATA.forEach(d => spawnNote(d, board));

    // live decay engine
    const decayTimer1 = setInterval(() => {
      const notes = Array.from(board.querySelectorAll('.sticky-note'));
      const cooling = notes.filter(n => n.dataset.decay === 'cooling');
      if (cooling.length) { advanceDecayEl(cooling[Math.floor(Math.random() * cooling.length)]); return; }
      const fresh = notes.filter(n => n.dataset.decay === 'fresh');
      if (fresh.length > 2) advanceDecayEl(fresh[fresh.length - 1]);
    }, 8000);

    const decayTimer2 = setInterval(() => {
      const critical = Array.from(board.querySelectorAll('.sticky-note[data-decay="critical"]'));
      if (critical.length) animDissolve(critical[0]);
    }, 20000);

    // bubble engine
    for (let i = 0; i < 14; i++) {
      setTimeout(() => spawnBubble(board), i * 700 + Math.random() * 400);
    }
    const bubbleTimer = setInterval(() => spawnBubble(board), 2200 + Math.random() * 800);

    // input
    const input = document.getElementById('sib-input');
    const send  = document.getElementById('sib-send');
    const doSend = () => {
      const v = input.value.trim();
      if (!v) return;
      createNoteFromInput(v, board);
      input.value = '';
    };
    if (send)  send.onclick = doSend;
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });

    return () => {
      clearInterval(decayTimer1);
      clearInterval(decayTimer2);
      clearInterval(bubbleTimer);
    };
  }, []);

  return (
    <div className="layer" id="layer-sticky">
      <div className="layer-header">
        <div className="lh-zone">THERMOCLINE · —200m</div>
        <div className="lh-title">便利贴</div>
        <div className="lh-sub">短期记忆 · 拖拽至底部升级书架</div>
      </div>

      <div className="sticky-board" id="sticky-board">
        <div id="sticky-motes" />
        <div id="dissolve-zone"><div id="dissolve-zone-label">松手即消散</div></div>

        <div id="shelf-drop-zone">
          <div className="sdz-label">↓ 拖至此处 升级至书架</div>
        </div>

        <div className="decay-legend">
          <div className="dl-legend-title">记忆状态</div>
          <div className="dl-sep" />
          <div className="dl-row"><div className="dl-swatch s-fresh" /><span className="dl-label">鲜活</span></div>
          <div className="dl-row"><div className="dl-swatch s-cooling" /><span className="dl-label">冷却</span></div>
          <div className="dl-row"><div className="dl-swatch s-fading" /><span className="dl-label">褪色</span></div>
          <div className="dl-row"><div className="dl-swatch s-critical" /><span className="dl-label">临界</span></div>
        </div>
      </div>

      <div className="sticky-input-wrap">
        <div className="sticky-input-box">
          <div className="sib-pulse" />
          <input className="sib-input" id="sib-input" placeholder="输入对话内容，实时生成便利贴记忆…" maxLength={80} />
          <div className="sib-send" id="sib-send">生成</div>
        </div>
      </div>
    </div>
  );
}
