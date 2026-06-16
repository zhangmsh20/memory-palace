/**
 * LayerShelf.jsx — 书架层（改造版）
 *
 * 相比原版，改动点：
 *
 * 1. 接入 MemoryRefinement（记忆提炼面板）
 *    - BookPage 里「↓ 压入档案馆」按钮 → 不再直接关闭，
 *      改为调用 setRefinementBook(book) 打开提炼面板
 *    - book-card 悬浮卡里的「↑」归档按钮同样接入
 *    - MemoryRefinement.onConfirm → 移除书本 DOM + 显示 toast
 *
 * 2. 接入 NightConsolidation（深夜整理）
 *    - 顶部渲染 NightBanner（有 night event 时）
 *    - 书架层内渲染 NightReviewOverlay（用户点「查看整理」时）
 *    - 新增「🌙 模拟深夜」按钮（演示用，紧跟原「▶ 动态演示」）
 *    - 模拟深夜动画：屏幕变暗 → 书本快速衰减 → 恢复 + 横幅
 *
 * 3. 保持原有逻辑 100% 不变：
 *    - initBookDecay / runBookTimer / advanceBookStage / makeDust
 *    - SCENE_MODES 场景切换
 *    - isDemoMode prop 控制动态衰减
 *    - BookPage 本体（仅修改「压入档案馆」按钮的行为）
 *
 * Props（与原版相同，无需父层修改）：
 *   isDemoMode: boolean
 */

import { useEffect, useRef, useState } from 'react';
import { BOOKS, TAG_COLORS } from '../../data/books';
import { BOOK_STAGE_DURATION } from '../../utils/decay';
import MemoryRefinement from '../ui/MemoryRefinement';
import {
  useNightConsolidation,
  NightBanner,
  NightReviewOverlay,
} from '../ui/NightConsolidation';

/* ─────────────────── 原有常量（不动） ─────────────────── */
const BOOK_DECAY_STAGES = ['fresh', 'cooling', 'fading', 'critical'];
const STATIC_PROGRESS   = { fresh: 0.15, cooling: 0.55, fading: 0.80, critical: 1.0 };

const SCENE_MODES = [
  { id: 'reset',     icon: '○',  label: '全部显示',  tags: null },
  { id: 'cooking',   icon: '🍳', label: '想做饭了',  tags: ['life'] },
  { id: 'work',      icon: '💼', label: '工作模式',  tags: ['work', 'know'] },
  { id: 'fitness',   icon: '🏃', label: '健身计划',  tags: ['life'], bookFilter: ['健身计划', '用户研究笔记'] },
  { id: 'emotion',   icon: '😊', label: '情绪复盘',  tags: ['emo', 'id'] },
  { id: 'knowledge', icon: '📚', label: '知识整理',  tags: ['know'] },
];

/* ─────────────────── 工具函数（不动） ─────────────────── */
function showToast(msg, col = 'rgba(80,220,180,0.9)') {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; t.style.color = col;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function makeDust(decay) {
  if (decay === 'fresh') return '';
  const n = { cooling: 1, fading: 3, critical: 5 }[decay] || 0;
  return Array.from({ length: n }, (_, i) =>
    `<div class="dust" style="left:${40 + i * 10}%;top:0;--dur:${6 + i * 2}s;--del:${i * 1.5}s;--dx:${-5 + i * 3}px"></div>`
  ).join('');
}

function runBookTimer(el) {
  function tick() {
    if (!el.isConnected) return;
    if (el.dataset.stage === 'critical') return;
    if (el.dataset.paused === 'true') return;
    const elapsed  = Date.now() - parseInt(el.dataset.stageStart);
    const duration = parseInt(el.dataset.stageMs);
    const pct      = Math.min(1, elapsed / duration);
    const fill     = el.querySelector('.bdp-fill');
    if (fill) fill.style.width = (pct * 100) + '%';
    if (pct >= 1) advanceBookStage(el);
    else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function advanceBookStage(el) {
  const cur  = el.dataset.stage;
  const next = { fresh: 'cooling', cooling: 'fading', fading: 'critical' }[cur];
  if (!next) return;
  BOOK_DECAY_STAGES.forEach(s => el.classList.remove(s));
  el.classList.add(next);
  el.dataset.stage      = next;
  el.dataset.stageStart = Date.now();
  el.dataset.stageMs    = BOOK_STAGE_DURATION[next] || (12000 + Math.random() * 6000);
  if (next === 'cooling' || next === 'fading') {
    const d = document.createElement('div'); d.className = 'dust';
    d.style.cssText = `left:${45 + Math.random() * 20}%;top:0;--dur:${6 + Math.random() * 4}s;--del:0s;--dx:${-3 + Math.random() * 6}px`;
    el.appendChild(d);
  }
  if (next !== 'critical') {
    if (el.dataset.paused !== 'true') runBookTimer(el);
  } else {
    const fill = el.querySelector('.bdp-fill');
    if (fill) {
      fill.style.width = '100%';
      fill.style.background = 'rgba(255,80,80,0.7)';
      fill.style.animation = 'critFill 1.8s ease-in-out infinite';
    }
  }
}

function initBookDecay(el, i) {
  const initDecay = el.dataset.initDecay || 'fresh';
  el.dataset.stage      = initDecay;
  el.dataset.stageStart = Date.now();
  el.dataset.stageMs    = BOOK_STAGE_DURATION[initDecay] + i * 1200 + Math.random() * 5000;
  el.dataset.paused     = 'true';
  const prog = document.createElement('div');
  prog.className = 'book-decay-prog';
  prog.innerHTML = '<div class="bdp-fill"></div>';
  el.querySelector('.book-spine').appendChild(prog);
  const fill = prog.querySelector('.bdp-fill');
  if (initDecay === 'critical') {
    fill.style.width = '100%';
    fill.style.background = 'rgba(255,80,80,0.7)';
    fill.style.animation = 'critFill 1.8s ease-in-out infinite';
    return;
  }
  const staticPct = STATIC_PROGRESS[initDecay] || 0.15;
  fill.style.width = (staticPct * 100) + '%';
}

/* ══════════════════════════════════════════════════════════
   主组件
   ══════════════════════════════════════════════════════════ */
export default function LayerShelf({ isDemoMode }) {
  const inited      = useRef(false);
  const [openBook,       setOpenBook]       = useState(null);  // BookPage 用
  const [refinementBook, setRefinementBook] = useState(null);  // MemoryRefinement 用
  const [activeScene,    setActiveScene]    = useState('reset');
  const [showNightReview, setShowNightReview] = useState(false);

  /* 深夜整理 hook */
  const night = useNightConsolidation();

  /* ── 模拟深夜动画 ── */
  function simulateNight() {
    /* 1. 屏幕变暗 */
    const veil = document.createElement('div');
    veil.style.cssText = `
      position:fixed;inset:0;z-index:700;
      background:rgba(2,2,10,0);pointer-events:none;
      transition:background 0.5s ease;
    `;
    document.body.appendChild(veil);
    requestAnimationFrame(() => {
      veil.style.background = 'rgba(2,2,10,0.7)';
    });

    /* 2. 快速衰减动画（1.5s 后） */
    setTimeout(() => {
      document.querySelectorAll('.book:not(.critical)').forEach((el, idx) => {
        setTimeout(() => {
          const cur  = el.dataset.stage || 'fresh';
          const next = { fresh: 'cooling', cooling: 'fading', fading: 'critical' }[cur];
          if (!next) return;
          BOOK_DECAY_STAGES.forEach(s => el.classList.remove(s));
          el.classList.add(next);
          el.dataset.stage = next;
          /* 视觉加速：直接把进度条拉满 */
          const fill = el.querySelector('.bdp-fill');
          if (fill) {
            fill.style.transition = 'width 0.6s ease';
            fill.style.width = next === 'critical' ? '100%' : { cooling: '55%', fading: '80%' }[next] || '15%';
            if (next === 'critical') {
              fill.style.background = 'rgba(255,80,80,0.7)';
              fill.style.animation = 'critFill 1.8s ease-in-out infinite';
              /* ★ 系统建议：critical 时提示用户提炼 */
              if (!el.dataset.critSuggested) {
                el.dataset.critSuggested = 'true';
                setTimeout(() => {
                  showToast(
                    `「${BOOKS[parseInt(el.dataset.idx)]?.title}」已很久未翻开，要提炼一下吗？`,
                    'rgba(255,160,80,0.85)'
                  );
                }, 600);
              }
            }
          }
          /* 加灰尘 */
          if (next !== 'fresh') {
            const d = document.createElement('div'); d.className = 'dust';
            d.style.cssText = `left:${45 + Math.random() * 20}%;top:0;--dur:${5 + Math.random() * 3}s;--del:0s;--dx:${-3 + Math.random() * 6}px`;
            el.appendChild(d);
          }
        }, idx * 80);
      });
    }, 500);

    /* 3. 恢复亮度 + 触发深夜事件 */
    setTimeout(() => {
      veil.style.background = 'rgba(2,2,10,0)';
      setTimeout(() => veil.remove(), 600);
      night.triggerNight();
    }, 2200);
  }

  /* ── 提炼面板确认 ── */
  function handleRefinementConfirm(imprint, destOpt, forgot = false) {
    if (!refinementBook) return;
    /* 从 DOM 中找到对应书本并移除 */
    document.querySelectorAll('.book').forEach(el => {
      const idx = parseInt(el.dataset.idx);
      if (BOOKS[idx]?.title === refinementBook.title) {
        el.style.transition = 'all .8s cubic-bezier(.4,0,.2,1)';
        el.style.transform  = 'translateY(32px) scale(0.7)';
        el.style.opacity    = '0';
        setTimeout(() => el.remove(), 850);
      }
    });
    if (forgot) {
      showToast('～ 记忆已消散，未留下任何印记', 'rgba(255,255,255,0.3)');
    } else {
      const destLabel = destOpt?.label || '档案馆';
      showToast(`✦ 印记已沉入${destLabel}：${imprint.slice(0, 18)}…`);
    }
  }

  /* ── 初始化（与原版完全相同） ── */
  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    const shelf = document.getElementById('bookshelf');
    if (!shelf) return;

    const rows = [document.createElement('div'), document.createElement('div')];
    rows.forEach(r => { r.className = 'shelf-row'; shelf.appendChild(r); });

    BOOKS.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = `book ${b.decay}`;
      el.dataset.idx       = i;
      el.dataset.initDecay = b.decay;
      el.style.height = b.h + 'px';
      el.style.setProperty('--book-h', b.h + 'px');
      el.innerHTML = `
        <div class="book-spine" style="height:${b.h}px;width:${b.w}px;background:${b.color}">
          <div class="book-tag-dot" style="background:${TAG_COLORS[b.tag]}"></div>
          <div class="book-title">${b.title}</div>
        </div>
        <div class="book-cover" style="height:${b.h}px;background:${b.color}"></div>
        <div class="book-top" style="background:${b.color}"></div>
        ${makeDust(b.decay)}
        <div class="book-card">
          <div class="bc-title">${b.title}</div>
          <div class="bc-summary">${b.summary}</div>
          <div class="bc-actions">
            <div class="bc-btn archive" data-archive="${i}" title="提炼">✦</div>
            <div class="bc-btn burn"    data-burn="${i}"    title="销毁记忆">🔥</div>
            <div class="bc-btn open"    data-open="${i}"    title="打开查阅">⬜</div>
          </div>
        </div>`;
      rows[b.row].appendChild(el);
      initBookDecay(el, i);

      el.querySelector('.book-spine').addEventListener('click', (e) => {
        e.stopPropagation();
        setOpenBook(BOOKS[i]);
      });

      const card = el.querySelector('.book-card');
      card.addEventListener('click', e => e.stopPropagation());

      /* ★ 改造：book-card 归档按钮 → 打开提炼面板 */
      card.querySelector('[data-archive]').addEventListener('click', (e) => {
        e.stopPropagation();
        setRefinementBook(BOOKS[i]);
      });

      card.querySelector('[data-burn]').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = el.getBoundingClientRect();
        for (let k = 0; k < 14; k++) {
          const p = document.createElement('div'); p.className = 'fire-p';
          const sz = 3 + Math.random() * 9;
          p.style.cssText = `width:${sz}px;height:${sz}px;left:${rect.left + rect.width * .5}px;top:${rect.top + rect.height * .5}px;background:hsl(${15 + Math.random() * 35},92%,${48 + Math.random() * 22}%);--tx:${-35 + Math.random() * 70}px;--ty:${-70 + Math.random() * -35}px;animation-delay:${Math.random() * .25}s`;
          document.body.appendChild(p); setTimeout(() => p.remove(), 1100);
        }
        el.style.transition = 'all .5s ease';
        el.style.opacity    = '0';
        el.style.transform  = 'scale(0)';
        setTimeout(() => el.remove(), 500);
        showToast('🔥 记忆已销毁', 'var(--tag-rel)');
      });

      card.querySelector('[data-open]').addEventListener('click', (e) => {
        e.stopPropagation();
        setOpenBook(BOOKS[i]);
      });
    });
  }, []);

  /* ── isDemoMode 切换（与原版相同） ── */
  useEffect(() => {
    const bookEls = Array.from(document.querySelectorAll('.book[data-init-decay]'));
    bookEls.forEach(el => {
      if (el.dataset.stage === 'critical') return;
      if (isDemoMode) {
        el.dataset.paused     = 'false';
        el.dataset.stageStart = Date.now();
        runBookTimer(el);
      } else {
        el.dataset.paused = 'true';
      }
    });
  }, [isDemoMode]);

  /* ── 场景切换（与原版相同） ── */
  function applyScene(sceneId) {
    setActiveScene(sceneId);
    document.querySelectorAll('.book').forEach(b => {
      b.classList.remove('triggered');
      b.style.removeProperty('opacity');
      b.style.removeProperty('transition');
      b.style.removeProperty('filter');
    });
    document.getElementById('shelf-overlay')?.classList.remove('on');
    if (sceneId === 'reset') return;
    const mode = SCENE_MODES.find(m => m.id === sceneId);
    if (!mode || !mode.tags) return;
    requestAnimationFrame(() => {
      document.getElementById('shelf-overlay')?.classList.add('on');
      document.querySelectorAll('.book').forEach(b => {
        const idx = parseInt(b.dataset.idx);
        if (idx < 0 || idx >= BOOKS.length) return;
        const book = BOOKS[idx];
        const tagMatch   = mode.tags.includes(book.tag);
        const titleMatch = mode.bookFilter
          ? mode.bookFilter.some(t => book.title.includes(t))
          : tagMatch;
        const isActive = mode.bookFilter ? (tagMatch && titleMatch) || titleMatch : tagMatch;
        if (isActive) {
          b.classList.add('triggered');
        } else {
          b.style.opacity    = '0.12';
          b.style.transition = 'opacity .4s ease';
          b.style.filter     = 'saturate(0.2)';
        }
      });
    });
  }

  /* ══════════════════ render ══════════════════ */
  return (
    <>
      {/* ★ 深夜横幅（fixed 定位，覆盖首屏顶部） */}
      {night.hasNightEvent && !showNightReview && (
        <NightBanner
          count={night.archivedCount}
          onReview={() => setShowNightReview(true)}
          onDismiss={night.dismissBanner}
        />
      )}

      <div className="layer" id="layer-shelf">
        <div className="coral-glow" />
        <div className="layer-header">
          <div className="lh-zone">CORAL REEF · —1000m</div>
          <div className="lh-title">书架</div>
          <div className="lh-sub">中期记忆 · 点击书脊查阅 · 场景模式聚焦</div>
        </div>

        {/* ★ 模拟深夜按钮（演示专用） — 与 merge-demo-btn 同级（.layer 的直接子元素），
            避免被 .layer-header 的尺寸/pointer-events 影响定位与点击 */}
        <button
          className="night-sim-btn"
          onClick={simulateNight}
          title="模拟一夜过去，触发深夜整理"
        >
          🌙 模拟深夜
        </button>

        <div className="shelf-room">
          <div className="bookshelf" id="bookshelf" />
          <div className="shelf-overlay" id="shelf-overlay" />

          <div className="shelf-scene-bar">
            <span className="scene-bar-label">查看模式</span>
            <div className="scene-pills">
              {SCENE_MODES.map(m => (
                <div
                  key={m.id}
                  className={`scene-pill ${activeScene === m.id ? 'active' : ''}`}
                  onClick={() => applyScene(m.id)}
                >
                  <span className="sp-icon">{m.icon}</span>
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ★ 书页浮层（BookPage，内部「压入档案馆」改为打开提炼面板） */}
      {openBook && (
        <BookPage
          book={openBook}
          onClose={() => setOpenBook(null)}
          onOpenRefinement={(book) => {
            setOpenBook(null);           // 先关闭书页
            setRefinementBook(book);     // 再打开提炼面板
          }}
        />
      )}

      {/* ★ 记忆提炼面板 */}
      {refinementBook && (
        <MemoryRefinement
          book={refinementBook}
          onClose={() => setRefinementBook(null)}
          onConfirm={(imprint) => {
            handleRefinementConfirm(imprint);
            setRefinementBook(null);
          }}
        />
      )}

      {/* ★ 深夜整理回顾浮层 */}
      {showNightReview && (
        <NightReviewOverlay
          records={night.nightRecords}
          onSalvage={night.salvageEntry}
          onDone={() => {
            setShowNightReview(false);
            night.markDone();
          }}
        />
      )}

      <style>{SHELF_EXTRA_STYLES}</style>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   BookPage — 书页浮层（★ 增加 onOpenRefinement prop）
   ══════════════════════════════════════════════════════════ */
const DECAY_LABEL = { fresh: '鲜活', cooling: '冷却中', fading: '褪色', critical: '临界' };
const DECAY_COLOR = {
  fresh:    'rgba(80,220,180,0.9)',
  cooling:  'rgba(255,200,80,0.8)',
  fading:   'rgba(180,150,90,0.7)',
  critical: 'rgba(255,80,80,0.8)',
};

function BookPage({ book, onClose, onOpenRefinement }) {
  const [entries, setEntries] = useState(book.entries || []);
  const tagColor = TAG_COLORS[book.tag] || '#fff';

  useEffect(() => {
    const ocean = document.getElementById('ocean');
    if (ocean) ocean.style.overflow = 'hidden';
    const blockWheel = e => e.stopPropagation();
    document.addEventListener('wheel', blockWheel, { capture: true });
    return () => {
      if (ocean) ocean.style.overflow = '';
      document.removeEventListener('wheel', blockWheel, { capture: true });
    };
  }, []);

  function deleteEntry(id)      { setEntries(prev => prev.filter(e => e.id !== id)); }
  function toggleImportant(id)  { setEntries(prev => prev.map(e => e.id === id ? { ...e, important: !e.important } : e)); }

  return (
    <div className="book-page-overlay" onClick={onClose}>
      <div className="book-page-panel" onClick={e => e.stopPropagation()}>
        <div className="bp-left" style={{ borderColor: tagColor + '30' }}>
          <div className="bp-cover-strip" style={{ background: book.color }} />
          <div className="bp-meta">
            <div className="bp-tag-dot" style={{ background: tagColor }} />
            <div className="bp-category" style={{ color: tagColor }}>{book.tags.join(' · ')}</div>
          </div>
          <div className="bp-title">{book.title}</div>
          <div className="bp-summary">{book.summary}</div>
          <div className="bp-stats">
            <div className="bp-stat">
              <span className="bp-stat-num">{entries.length}</span>
              <span className="bp-stat-label">条记忆</span>
            </div>
            <div className="bp-stat">
              <span className="bp-stat-num">{entries.filter(e => e.important).length}</span>
              <span className="bp-stat-label">标记重要</span>
            </div>
          </div>
          <div className="bp-decay-badge" style={{ color: DECAY_COLOR[book.decay], borderColor: DECAY_COLOR[book.decay] + '40' }}>
            <span className="bp-decay-dot" style={{ background: DECAY_COLOR[book.decay] }} />
            {DECAY_LABEL[book.decay]}
          </div>
          <div className="bp-actions">
            {/* ★ 改造：点击「压入档案馆」→ 打开提炼面板，而不是直接归档 */}
            <div
              className="bp-action-btn archive bp-action-btn--refine"
              onClick={() => onOpenRefinement(book)}
              title="打开记忆提炼面板，决定留下什么"
            >
              ✦ 提炼
            </div>
            <div className="bp-action-btn burn" onClick={() => { onClose(); showToast('🔥 书籍已销毁', 'var(--tag-rel)'); }}>
              🔥 销毁
            </div>
          </div>
        </div>
        <div className="bp-right">
          <div className="bp-right-header">
            <div className="bp-right-title">记忆条目</div>
            <div className="bp-right-hint">点击 ★ 标记重要 · 点击 × 删除</div>
          </div>
          <div className="bp-entries">
            {entries.length === 0 && <div className="bp-empty">这本书的记忆已全部删除</div>}
            {entries.map(e => (
              <div key={e.id} className={`bp-entry ${e.decay} ${e.important ? 'important' : ''}`}>
                <div className="bp-entry-body">
                  <div className="bp-entry-text">{e.text}</div>
                  <div className="bp-entry-meta">
                    <span className="bp-entry-time">{e.time}</span>
                    <span className="bp-entry-decay" style={{ color: DECAY_COLOR[e.decay] }}>{DECAY_LABEL[e.decay]}</span>
                  </div>
                </div>
                <div className="bp-entry-actions">
                  <button
                    className={`bp-star ${e.important ? 'on' : ''}`}
                    onClick={() => toggleImportant(e.id)}
                    style={{ color: e.important ? '#ffd93d' : 'rgba(255,255,255,0.2)' }}
                  >★</button>
                  <button className="bp-del" onClick={() => deleteEntry(e.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bp-close" onClick={onClose}>✕</div>
      </div>
    </div>
  );
}

/* ── 新增样式（仅补充，不覆盖原有 shelf CSS） ── */
const SHELF_EXTRA_STYLES = `

/* 模拟深夜按钮 — 现在是 .layer 的直接子元素，
   位置与 LayerSticky 中的 .merge-demo-btn 保持同一约定（top:72px; right:88px，避开深度计） */
.night-sim-btn {
  position: absolute;
  top: 72px; right: 88px;
  z-index: 50;
  background: rgba(255,160,50,0.1);
  border: 1px solid rgba(255,160,50,0.25);
  border-radius: 7px;
  color: rgba(255,200,80,0.75);
  font-size: 11px;
  font-family: var(--font-b);
  padding: 5px 13px;
  cursor: pointer;
  transition: all .2s ease;
  letter-spacing: 0.04em;
  pointer-events: all;
}
.night-sim-btn:hover {
  background: rgba(255,160,50,0.2);
  color: rgba(255,220,100,0.95);
  box-shadow: 0 0 12px rgba(255,140,30,0.2);
}

/* BookPage 提炼归档按钮视觉区分 */
.bp-action-btn--refine {
  background: rgba(110,70,255,0.12) !important;
  border-color: rgba(110,70,255,0.3) !important;
  color: rgba(180,140,255,0.9) !important;
}
.bp-action-btn--refine:hover {
  background: rgba(110,70,255,0.22) !important;
  box-shadow: 0 0 14px rgba(110,70,255,0.25) !important;
}

/* ★ 修复：原 ".layer-header { position: relative; }" 是全局样式，
   会把 #layer-sticky 和 #layer-shelf 的 .layer-header 一起从
   绝对定位改成相对定位，导致两层标题块被拖入 flex 居中布局，
   跑到画面中间和便利贴/书本重叠。
   .layer-header 本身原本就是 absolute/fixed（脱离文档流钉在角落），
   已经是合法的定位上下文，.night-sim-btn 的 position:absolute
   不需要这条规则即可正常以 .layer-header 为基准定位，故删除。 */
`;
