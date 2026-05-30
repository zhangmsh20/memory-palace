import { useEffect, useRef } from 'react';
import { STICKY_DATA, TIME_BANDS, TAG_HEX_MAP } from '../../data/stickyNotes';
import { setupDrag } from '../../hooks/useDrag';
import { decayLabel } from '../../utils/decay';

// ── float engine ──
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
  t.className = 'toast'; t.textContent = msg; t.style.color = col;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

const STATIC_PROG = { fresh: 0.45, cooling: 0.72, fading: 0.72, critical: 1.0 };

function getProgColor(decay) {
  return {
    fresh:    'rgba(80,220,180,0.75)',
    cooling:  'rgba(255,200,80,0.75)',
    fading:   'rgba(255,140,60,0.75)',
    critical: 'rgba(255,70,70,0.8)',
  }[decay] || 'rgba(255,255,255,0.3)';
}

function injectProgress(el, decay) {
  const prog = document.createElement('div');
  prog.className = 'sn-prog';
  const fill = document.createElement('div');
  fill.className = 'sn-prog-fill';
  fill.style.width   = (STATIC_PROG[decay] || 0.45) * 100 + '%';
  fill.style.background = getProgColor(decay);
  if (decay === 'critical') fill.style.animation = 'snCritFill 1.8s ease-in-out infinite';
  prog.appendChild(fill);
  el.appendChild(prog);
  return fill;
}

function startProgTimer(el, fill) {
  const DURATIONS = { fresh: 30000, cooling: 22000, fading: 18000 };
  const decay = el.dataset.decay;
  if (decay === 'critical') return;
  const dur = DURATIONS[decay] || 20000;
  const start = Date.now();
  const startPct = STATIC_PROG[decay] || 0.45;
  function tick() {
    if (!el.isConnected) return;
    if (el.dataset.progPaused === 'true') return;
    const elapsed = Date.now() - start;
    const pct = Math.min(1, startPct + (1 - startPct) * (elapsed / dur));
    fill.style.width = (pct * 100) + '%';
    if (pct < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function advanceDecayEl(el) {
  const cur  = el.dataset.decay;
  const next = { fresh: 'cooling', cooling: 'critical', fading: 'critical' }[cur];
  if (!next) return;
  el.dataset.decay = next;
  ['fresh','cooling','fading','critical'].forEach(d => el.classList.remove('decay-' + d));
  el.classList.add('decay-' + next);
  const tEl = el.querySelector('.s-time');
  if (tEl) tEl.textContent = decayLabel(next);
  const fill = el.querySelector('.sn-prog-fill');
  if (fill) {
    fill.style.background = getProgColor(next);
    if (next === 'critical') {
      fill.style.width = '100%';
      fill.style.animation = 'snCritFill 1.8s ease-in-out infinite';
    }
  }
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

function spawnNote(d, board, isDemoMode = false) {
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
  const fill = injectProgress(el, d.decay);
  el.dataset.progPaused = isDemoMode ? 'false' : 'true';
  if (isDemoMode && d.decay !== 'critical') startProgTimer(el, fill);
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
  const fill = injectProgress(el, 'fresh');
  el.dataset.progPaused = 'true';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transform = `translate(${px}px,${py}px) rotate(${r}deg) scale(1)`;
    el.style.opacity   = '1';
  }));
  setTimeout(() => { el.style.transition = ''; startNoteFloat(el, Math.random() * 10); }, 450);
  setupDrag(el, { showToast, startNoteFloat, stopNoteFloat });
  showToast('✦ 便利贴已生成');
  setTimeout(() => checkMergeHint(board), 100);
}

// ── ✦ 新增：合并演示 —— 注入3张"工作"标签便利贴后触发合并流程 ──
function triggerMergeDemo(board) {
  const demoNotes = [
    { text: '完成记忆宫殿原型设计稿', tag: '工作', cls: 'c-blue', r: -2 },
    { text: '整理黑客松评审材料', tag: '工作', cls: 'c-blue', r: 1.5 },
    { text: '与团队同步产品方向', tag: '工作', cls: 'c-blue', r: -1 },
  ];
  const bw = window.innerWidth;
  const bh = window.innerHeight;
  const noteW = 168;

  demoNotes.forEach((d, i) => {
    const px = 200 + i * 190 + Math.random() * 30;
    const py = bh * 0.42 + Math.random() * (bh * 0.12);
    const el = document.createElement('div');
    el.className = `sticky-note ${d.cls} decay-fresh`;
    el.dataset.decay = 'fresh';
    el.dataset.px = px; el.dataset.py = py; el.dataset.r = d.r;
    el.style.cssText = `position:absolute;left:0;top:0;transform:translate(${px}px,${py}px) rotate(${d.r}deg) scale(0.2);opacity:0;will-change:transform;z-index:100;transition:transform .5s cubic-bezier(.34,1.56,.64,1) ${i * 0.18}s, opacity .35s ease ${i * 0.18}s;`;
    el.innerHTML = `<div class="s-pin"></div><div class="s-badge"><div class="s-dot"></div>${d.tag}</div>${d.text}<div class="s-time">刚刚</div>`;
    board.appendChild(el);
    injectProgress(el, 'fresh');
    el.dataset.progPaused = 'true';

    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = `translate(${px}px,${py}px) rotate(${d.r}deg) scale(1)`;
      el.style.opacity = '1';
    }));
    setTimeout(() => {
      el.style.transition = '';
      startNoteFloat(el, Math.random() * 10);
    }, 500 + i * 180);
    setupDrag(el, { showToast, startNoteFloat, stopNoteFloat });
  });

  // 注入完成后触发合并提示
  setTimeout(() => checkMergeHint(board), 700);
  showToast('✦ 注入3条「工作」记忆，等待合并…', 'rgba(74,158,255,0.9)');
}

// ── 合并粒子 ──
function spawnMergeParticles(noteEls) {
  const targetX = window.innerWidth / 2;
  const targetY = window.innerHeight * 0.88;
  noteEls.forEach((el, noteIdx) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'merge-particle';
      const startX = cx + (-16 + Math.random() * 32);
      const startY = cy + (-10 + Math.random() * 20);
      const endDX = targetX - startX + (-20 + Math.random() * 40);
      const endDY = targetY - startY + (-10 + Math.random() * 20);
      const colors = ['rgba(255,200,80,0.9)','rgba(255,180,60,0.85)','rgba(255,220,120,0.9)','rgba(255,160,60,0.8)'];
      const col = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 5;
      const delay = noteIdx * 0.06 + Math.random() * 0.1;
      const dur = 0.55 + Math.random() * 0.25;
      p.style.cssText = [
        `left:${startX}px`, `top:${startY}px`,
        `width:${size}px`, `height:${size}px`,
        `background:${col}`, `box-shadow:0 0 ${size * 2}px ${col}`,
        `--mp-tx:${endDX}px`, `--mp-ty:${endDY}px`,
        `--mp-dur:${dur}s`, `--mp-del:${delay}s`,
      ].join(';');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), (delay + dur) * 1000 + 100);
    }
  });
}

function flashShelfMerge() {
  const flash = document.createElement('div');
  flash.className = 'shelf-merge-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1300);
}

function getBadgeTag(note) {
  const badge = note.querySelector('.s-badge');
  if (!badge) return '';
  const textNode = Array.from(badge.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
  return textNode ? textNode.textContent.trim() : badge.textContent.trim();
}

function checkMergeHint(board) {
  const notes = Array.from(board.querySelectorAll('.sticky-note'));
  const tagMap = {};
  notes.forEach(n => {
    const tag = getBadgeTag(n);
    if (!tag) return;
    if (!tagMap[tag]) tagMap[tag] = [];
    tagMap[tag].push(n);
  });
  const hit = Object.entries(tagMap).find(([, els]) => els.length >= 3);
  let hint = document.getElementById('merge-hint');
  if (hit) {
    const [hitTag, hitEls] = hit;
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'merge-hint';
      hint.className = 'merge-hint';
      hint.innerHTML = `
        <span class="mh-icon">✦</span>
        <span class="mh-text">发现 <strong>${hitEls.length}</strong> 条「${hitTag}」记忆可合并</span>
        <button class="mh-btn primary" id="merge-confirm">合并升级至书架</button>
        <button class="mh-btn" id="merge-ignore">忽略</button>
      `;
      const sdz = document.getElementById('shelf-drop-zone');
      if (sdz && sdz.parentNode) sdz.parentNode.insertBefore(hint, sdz);
      else board.appendChild(hint);
      requestAnimationFrame(() => requestAnimationFrame(() => hint.classList.add('visible')));
      document.getElementById('merge-ignore').onclick = () => {
        hint.classList.remove('visible');
        setTimeout(() => hint.remove(), 350);
      };
      document.getElementById('merge-confirm').onclick = () => {
        const targetNotes = Array.from(board.querySelectorAll('.sticky-note'))
          .filter(n => getBadgeTag(n) === hitTag);
        const confirmBtn = document.getElementById('merge-confirm');
        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '合并中…'; }
        spawnMergeParticles(targetNotes);
        targetNotes.forEach((n, i) => {
          setTimeout(() => {
            stopNoteFloat(n);
            const sx = parseFloat(n.dataset.px) || 0;
            const sy = parseFloat(n.dataset.py) || 0;
            const r  = parseFloat(n.dataset.r)  || 0;
            const targetLeft = window.innerWidth / 2 - sx;
            const targetDown = window.innerHeight * 0.85 - sy;
            n.style.transition = 'transform 0.75s cubic-bezier(.4,0,.2,1), opacity 0.65s ease, filter 0.5s ease';
            n.style.transform  = `translate(${sx + targetLeft * 0.6}px,${sy + targetDown}px) rotate(${r + (-12 + Math.random() * 24)}deg) scale(0.2)`;
            n.style.opacity    = '0';
            n.style.filter     = 'saturate(2.8) brightness(2.2)';
            n.style.zIndex     = '200';
            setTimeout(() => n.remove(), 780);
          }, i * 80);
        });
        setTimeout(() => flashShelfMerge(), targetNotes.length * 80 + 200);
        setTimeout(() => {
          showToast(`📚 「${hitTag}」记忆已合并升级至书架`, 'rgba(255,200,80,0.95)');
        }, targetNotes.length * 80 + 350);
        hint.classList.remove('visible');
        setTimeout(() => hint.remove(), 350);
      };
    }
  } else if (hint) {
    hint.classList.remove('visible');
    setTimeout(() => { if (hint.parentNode) hint.remove(); }, 350);
  }
}

// ── 书架层衰减时长 ──
import { BOOK_STAGE_DURATION } from '../../utils/decay';
const BOOK_DECAY_STAGES = ['fresh', 'cooling', 'fading', 'critical'];

export default function LayerSticky({ isDemoMode }) {
  const inited     = useRef(false);
  const timersRef  = useRef({ decay1: null, decay2: null, bubble: null });

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    const board = document.getElementById('sticky-board');
    if (!board) return;

    TIME_BANDS.forEach(b => {
      const el    = document.createElement('div');
      el.style.cssText = `position:absolute;left:0;right:0;top:${b.yFrom*100}%;height:${(b.yTo-b.yFrom)*100}%;background:${b.color};pointer-events:none;border-top:1px solid rgba(255,255,255,0.025);z-index:0;`;
      const label = document.createElement('div');
      label.style.cssText = `position:absolute;left:8px;top:6px;font-family:'Syne Mono',monospace;font-size:8px;letter-spacing:.15em;color:rgba(255,255,255,0.1);text-transform:uppercase;`;
      label.textContent = b.label;
      el.appendChild(label);
      board.appendChild(el);
    });

    STICKY_DATA.forEach(d => spawnNote(d, board, false));
    setTimeout(() => checkMergeHint(board), 400);

    for (let i = 0; i < 14; i++) {
      setTimeout(() => spawnBubble(board), i * 700 + Math.random() * 400);
    }
    timersRef.current.bubble = setInterval(() => spawnBubble(board), 2200 + Math.random() * 800);

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

    // ✦ 合并演示按钮
    const mergeBtn = document.getElementById('merge-demo-btn');
    if (mergeBtn) mergeBtn.onclick = () => triggerMergeDemo(board);

    return () => { clearInterval(timersRef.current.bubble); };
  }, []);

  useEffect(() => {
    const board = document.getElementById('sticky-board');
    if (!board) return;
    if (isDemoMode) {
      Array.from(board.querySelectorAll('.sticky-note')).forEach(el => {
        el.dataset.progPaused = 'false';
        const fill = el.querySelector('.sn-prog-fill');
        if (fill && el.dataset.decay !== 'critical') startProgTimer(el, fill);
      });
      timersRef.current.decay1 = setInterval(() => {
        const notes   = Array.from(board.querySelectorAll('.sticky-note'));
        const cooling = notes.filter(n => n.dataset.decay === 'cooling');
        if (cooling.length) {
          advanceDecayEl(cooling[Math.floor(Math.random() * cooling.length)]);
          checkMergeHint(board);
          return;
        }
        const fresh = notes.filter(n => n.dataset.decay === 'fresh');
        if (fresh.length > 2) {
          advanceDecayEl(fresh[fresh.length - 1]);
          checkMergeHint(board);
        }
      }, 8000);
      timersRef.current.decay2 = setInterval(() => {
        const critical = Array.from(board.querySelectorAll('.sticky-note[data-decay="critical"]'));
        if (critical.length) animDissolve(critical[0]);
      }, 20000);
    } else {
      Array.from(board.querySelectorAll('.sticky-note')).forEach(el => {
        el.dataset.progPaused = 'true';
      });
      clearInterval(timersRef.current.decay1);
      clearInterval(timersRef.current.decay2);
      timersRef.current.decay1 = null;
      timersRef.current.decay2 = null;
    }
    return () => {
      clearInterval(timersRef.current.decay1);
      clearInterval(timersRef.current.decay2);
    };
  }, [isDemoMode]);

  return (
    <div className="layer" id="layer-sticky">
      <div className="layer-header">
        <div className="lh-zone">THERMOCLINE · —200m</div>
        <div className="lh-title">便利贴</div>
        <div className="lh-sub">短期记忆 · 拖拽至底部升级书架 · 拖拽至顶部销毁</div>
      </div>

      {/* ✦ 新增：合并演示入口按钮，固定在层级右上角 */}
      <div className="merge-demo-entry" id="merge-demo-btn">
        <span className="mde-icon">✦</span>
        演示记忆合并
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
          <div className="dl-row"><div className="dl-swatch s-fresh"    /><span className="dl-label">鲜活</span></div>
          <div className="dl-row"><div className="dl-swatch s-cooling"  /><span className="dl-label">冷却</span></div>
          <div className="dl-row"><div className="dl-swatch s-fading"   /><span className="dl-label">褪色</span></div>
          <div className="dl-row"><div className="dl-swatch s-critical" /><span className="dl-label">临界</span></div>
        </div>
      </div>

      <div className="sticky-input-wrap">
        <div className="sticky-input-box">
          <div class="sib-pulse" />
          <input className="sib-input" id="sib-input" placeholder="输入对话内容，实时生成便利贴记忆…" maxLength={80} />
          <div className="sib-send" id="sib-send">生成</div>
        </div>
      </div>
    </div>
  );
}
